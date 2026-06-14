import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (!user[0]) return null;
        if (!user[0].password) return null;
        const valid = await bcrypt.compare(credentials.password, user[0].password);
        if (!valid) return null;
        return { id: user[0].id, name: user[0].name, email: user[0].email, image: user[0].image };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        const existingUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
        if (!existingUser.length) {
          await db.insert(users).values({
            id: crypto.randomUUID(),
            name: user.name || '',
            email: user.email!,
            image: user.image,
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      if (trigger === "update" && session?.image !== undefined) {
        token.picture = session.image;
      }
      if (!token.id && token.email) {
        const dbUser = await db.select().from(users).where(eq(users.email, token.email)).limit(1);
        if (dbUser[0]) {
          token.id = dbUser[0].id;
          if (!token.picture && dbUser[0].image) token.picture = dbUser[0].image;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
