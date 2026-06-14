import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.email) {
    const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!dbUser.length || !dbUser[0].industrySegment) {
      redirect('/profile');
    } else {
      redirect('/dashboard');
    }
  }
  
  return <>{children}</>;
}
