import Sidebar from '@/components/Sidebar';
import AICopilotPanel from '@/components/AICopilotPanel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import ClientGuard from '@/components/ClientGuard';
import Link from 'next/link';
import ShoppersButton from '@/components/ShoppersButton';
import { Suspense } from 'react';
import HeaderActions from '@/components/HeaderActions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');
  
  const dbUser = await db.select({ industrySegment: users.industrySegment }).from(users).where(eq(users.email, session.user.email)).limit(1);
  const isLocked = !dbUser[0]?.industrySegment;

  return (
    <div className="bg-background text-on-background min-h-screen">
      <ClientGuard isLocked={isLocked} />
      <Sidebar isLocked={isLocked} />
      <main className="md:pl-[240px] min-h-screen pb-24 md:pb-0 relative">
        <header className="flex justify-between items-center w-full h-16 px-margin-desktop bg-surface/50 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Good morning, {session.user?.name?.split(' ')[0] || 'User'} ✦</h2>
            <p className="font-body-md text-label-xs text-on-surface-variant">Here's how your shoppers are engaging today.</p>
          </div>
          <div className="flex items-center gap-md">
            <Suspense fallback={<div className="w-32 h-8"></div>}>
              <ShoppersButton />
            </Suspense>

              <HeaderActions initials={session.user?.name?.substring(0, 2) || "US"} />
          </div>
        </header>
        {children}
        <AICopilotPanel />
      </main>
      
      {!isLocked && (
        <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-margin-mobile pb-margin-mobile md:hidden bg-surface-container/80 backdrop-blur-xl border border-outline-variant/30 shadow-xl py-xs">
          <Link className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full p-xs" href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-xs text-label-xs">Dashboard</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/segments">
            <span className="material-symbols-outlined">groups</span>
            <span className="font-label-xs text-label-xs">Segments</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/campaigns">
            <span className="material-symbols-outlined">campaign</span>
            <span className="font-label-xs text-label-xs">Campaigns</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/analytics">
            <span className="material-symbols-outlined">insights</span>
            <span className="font-label-xs text-label-xs">Analytics</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/import">
            <span className="material-symbols-outlined">file_upload</span>
            <span className="font-label-xs text-label-xs">Import</span>
          </Link>
        </nav>
      )}
    </div>
  );
}