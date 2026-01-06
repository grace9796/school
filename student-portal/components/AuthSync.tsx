'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function AuthSync() {
    const { data: session, status } = useSession();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        const syncUser = async () => {
            // 只在已登入且未同步時執行
            if (status !== 'authenticated' || !session?.user || synced) return;

            // 檢查是否已有 studentId
            const existingStudentId = (session.user as any).studentId || localStorage.getItem('studentId');
            if (existingStudentId) {
                console.log('Student ID already exists:', existingStudentId);
                setSynced(true);
                return;
            }

            // 檢查是否已經嘗試過同步（避免無限循環）
            const syncAttempted = sessionStorage.getItem('authSyncAttempted');
            if (syncAttempted === 'true') {
                console.log('Sync already attempted, skipping to prevent infinite loop');
                setSynced(true);
                return;
            }

            // 標記已嘗試同步
            sessionStorage.setItem('authSyncAttempted', 'true');

            // 從 session 取得實際的 provider account ID
            const provider = (session.user as any).provider || 'unknown';
            let authId = '';

            // 嘗試從不同來源取得正確的 auth_id
            if ((session as any).user?.id) {
                authId = (session as any).user.id;
            } else if ((session as any).account?.providerAccountId) {
                authId = (session as any).account.providerAccountId;
            } else {
                // Fallback: 使用 email 或 name
                authId = session.user.email || session.user.name || '';
            }

            console.log('Auth sync params:', { provider, authId, email: session.user.email, name: session.user.name });

            // 同步用戶到後端
            try {
                console.log('Syncing user to backend...');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/api/auth/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth_provider: provider,
                        auth_id: authId,
                        email: session.user.email,
                        name: session.user.name,
                        profile_image: session.user.image,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('User synced, student_id:', data.student_id);

                    // 儲存到 localStorage
                    localStorage.setItem('studentId', data.student_id);

                    setSynced(true);

                    // 只重新載入一次
                    console.log('Reloading page to update session...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    console.error('Failed to sync user');
                    setSynced(true);
                }
            } catch (error) {
                console.error('Error syncing user:', error);
                setSynced(true);
            }
        };

        syncUser();
    }, [session, status, synced]);

    return null;
}
