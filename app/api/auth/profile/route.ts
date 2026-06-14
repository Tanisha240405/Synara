import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, companyName, role, industrySegment, image } = await req.json();

    await db.update(users)
      .set({ name, companyName, role, industrySegment, image })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
