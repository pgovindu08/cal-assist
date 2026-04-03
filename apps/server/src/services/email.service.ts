import { google } from 'googleapis';
import { prisma } from '../config/prisma';
import { decrypt, encrypt } from '../utils/encryption';
import { groq, GROQ_MODEL } from '../config/groq';
import { AppError } from '../middleware/errorHandler';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EmailCategory = 'Urgent' | 'Needs Reply' | 'Informational' | 'Newsletter' | 'Promotion';

export interface RawEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachment: boolean;
}

export interface SummarizedEmail extends RawEmail {
  summary: string;
  category: EmailCategory;
  isImportant: boolean;
  importantReason: string | null;
}

// ── OAuth helpers (same pattern as calendar.service.ts) ───────────────────────

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
}

async function getAuthorizedClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, tokenExpiresAt: true },
  });

  if (!user) throw new AppError('User not found', 404);
  if (!user.googleAccessToken) throw new AppError('No Google account connected', 400, 'NO_GOOGLE_ACCOUNT');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: decrypt(user.googleAccessToken),
    refresh_token: user.googleRefreshToken ? decrypt(user.googleRefreshToken) : null,
    expiry_date: user.tokenExpiresAt?.getTime(),
  });

  oauth2Client.on('tokens', async (tokens) => {
    const upd: Record<string, unknown> = {};
    if (tokens.access_token) {
      upd.googleAccessToken = encrypt(tokens.access_token);
      upd.tokenExpiresAt    = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000);
    }
    if (tokens.refresh_token) upd.googleRefreshToken = encrypt(tokens.refresh_token);
    if (Object.keys(upd).length) await prisma.user.update({ where: { id: userId }, data: upd });
  });

  return oauth2Client;
}

// ── Inbox list ─────────────────────────────────────────────────────────────────

export async function listUnreadEmails(userId: string, maxResults = 40): Promise<RawEmail[]> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread in:inbox',
    maxResults,
  });

  const refs = listRes.data.messages ?? [];
  if (!refs.length) return [];

  const messages = await Promise.all(
    refs.map((ref) =>
      gmail.users.messages.get({
        userId: 'me',
        id: ref.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })
    )
  );

  return messages.map((m) => {
    const headers = m.data.payload?.headers ?? [];
    const hdr = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
    const parts = m.data.payload?.parts ?? [];
    const hasAttachment = parts.some((p) => p.filename && p.filename.length > 0);

    return {
      id:            m.data.id!,
      threadId:      m.data.threadId!,
      subject:       hdr('Subject') || '(no subject)',
      from:          hdr('From'),
      date:          hdr('Date'),
      snippet:       m.data.snippet ?? '',
      hasAttachment,
    };
  });
}

// ── AI summarise & categorise ──────────────────────────────────────────────────

export async function summarizeEmails(emails: RawEmail[]): Promise<SummarizedEmail[]> {
  if (!emails.length) return [];

  const prompt = `You are an email assistant. Given a list of emails, categorize and summarize each one.

Return a JSON array with exactly ${emails.length} objects, one per email, in the SAME ORDER as input.
Each object must have:
- "id": the email id (copy from input)
- "summary": one plain-English sentence (max 15 words) describing what the email is about
- "category": exactly one of: "Urgent", "Needs Reply", "Informational", "Newsletter", "Promotion"
- "isImportant": boolean — true if the email seems to warrant the user's attention before deleting (e.g. has a deadline, from a real person, has an action item)
- "importantReason": short string explaining why it's important, or null if not important

Category rules:
- Urgent: deadlines, time-sensitive requests, action needed today
- Needs Reply: someone is waiting for a response from the user
- Informational: FYI emails, receipts, notifications that need no action
- Newsletter: email newsletters, digest emails, subscription content
- Promotion: marketing emails, sales, discounts, promotional offers

Emails:
${emails.map((e, i) => `${i + 1}. ID:${e.id} | From:${e.from} | Subject:${e.subject} | Snippet:${e.snippet.slice(0, 120)}`).join('\n')}

Respond with ONLY the JSON array, no other text.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  let parsed: { emails?: unknown[] } = { emails: [] };
  try {
    const raw = completion.choices[0]?.message?.content ?? '{}';
    // Groq json_object mode wraps arrays — handle both forms
    const obj = JSON.parse(raw);
    parsed = Array.isArray(obj) ? { emails: obj } : { emails: obj.emails ?? obj.results ?? Object.values(obj)[0] ?? [] };
  } catch {
    // Fallback: return emails with generic summary
    return emails.map((e) => ({ ...e, summary: e.snippet.slice(0, 80), category: 'Informational' as EmailCategory, isImportant: false, importantReason: null }));
  }

  const results = (parsed.emails ?? []) as Array<{
    id: string; summary: string; category: EmailCategory; isImportant: boolean; importantReason: string | null;
  }>;

  return emails.map((email) => {
    const ai = results.find((r) => r.id === email.id) ?? results[emails.indexOf(email)];
    return {
      ...email,
      summary:         ai?.summary         ?? email.snippet.slice(0, 80),
      category:        ai?.category        ?? 'Informational',
      isImportant:     ai?.isImportant     ?? false,
      importantReason: ai?.importantReason ?? null,
    };
  });
}

// ── Mutation actions ───────────────────────────────────────────────────────────

export async function trashEmail(userId: string, messageId: string): Promise<void> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.trash({ userId: 'me', id: messageId });
}

export async function untrashEmail(userId: string, messageId: string): Promise<void> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.untrash({ userId: 'me', id: messageId });
}

export async function archiveEmail(userId: string, messageId: string): Promise<void> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['INBOX'] },
  });
}

export async function batchTrash(userId: string, messageIds: string[]): Promise<void> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  // Gmail batchModify — add TRASH label, remove INBOX
  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: messageIds,
      addLabelIds:    ['TRASH'],
      removeLabelIds: ['INBOX'],
    },
  });
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const auth  = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}
