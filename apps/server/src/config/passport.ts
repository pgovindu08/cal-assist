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

        // Upsert: create if new, update tokens if existing (works for both Google & local-linked accounts)
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            googleId: profile.id,
            provider: 'GOOGLE',
            googleAccessToken: encryptedAccessToken,
            ...(encryptedRefreshToken && { googleRefreshToken: encryptedRefreshToken }),
            tokenExpiresAt,
          },
          create: {
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

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
