import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!dbUser[0]) redirect('/login');

  return (
    <div className="pt-8 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-xl">
        <h2 className="font-headline-md text-headline-md text-on-surface">Your Profile</h2>
        <p className="text-on-surface-variant mt-xs">Manage your personal information and workspace settings.</p>
        {!dbUser[0].industrySegment && (
          <div className="mt-md p-sm bg-primary/10 border border-primary/30 rounded-lg text-primary flex items-center gap-sm">
            <span className="material-symbols-outlined">info</span>
            <span className="text-body-md font-bold">Select your industry segment to unlock <Link href="/" className="text-primary hover:underline transition-colors">Synara</Link>.</span>
          </div>
        )}
      </div>
      <ProfileForm user={dbUser[0]} />
    </div>
  );
}
