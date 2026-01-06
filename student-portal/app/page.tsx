'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="text-center">
        <div className="text-6xl mb-4">🛹</div>
        <h1 className="text-4xl font-bold text-white mb-4">極限滑板學校</h1>
        <p className="text-white text-xl">載入中...</p>
      </div>
    </div>
  );
}
