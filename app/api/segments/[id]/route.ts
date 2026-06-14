import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = params.id;
  await db.delete(segments).where(eq(segments.id, id));

  return NextResponse.json({ success: true });
}
