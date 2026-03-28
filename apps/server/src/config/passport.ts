import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { prisma } from './prisma';
import { encrypt } from '../utils/encryption';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar',
      ],
    },
    async (_accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        const encryptedAccessToken = encrypt(_accessToken);
        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
        const tokenExpiresAt = new Date(Date.now() + 3600 * 1000);

        // If a LOCAL account already exists with this email, link it to Google
        const existing = await prisma.user.findUnique({ where: { email } });

        let user;
        if (existing) {
          user = await prisma.user.update({
            where: { email },
            data: {
              googleId: profile.id,
              provider: 'GOOGLE',
              name: existing.name || profile.displayName,
              avatarUrl: existing.avatarUrl ?? profile.photos?.[0]?.value ?? null,
              googleAccessToken: encryptedAccessToken,
              ...(encryptedRefreshToken && { googleRefreshToken: encryptedRefreshToken }),
              tokenExpiresAt,
            },
          });
        } else {
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value ?? null,
              provider: 'GOOGLE',
              googleAccessToken: encryptedAccessToken,
              googleRefreshToken: encryptedRefreshToken,
              tokenExpiresAt,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
