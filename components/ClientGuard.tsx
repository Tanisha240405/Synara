'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ClientGuard({ isLocked }: { isLocked: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLocked && pathname !== '/profile') {
      router.push('/profile');
    }
  }, [isLocked, pathname, router]);

  return null;
}
