'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl">🛹</span>
                            <h1 className="ml-2 text-xl font-bold text-gray-900">
                                極限滑板學校
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700">
                                {session.user?.name || session.user?.email}
                            </span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                            >
                                登出
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-6 text-white">
                        <h2 className="text-3xl font-bold mb-2">
                            ✅ 歡迎回來！
                        </h2>
                        <p className="text-purple-100">登入成功，準備開始您的滑板課程吧</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            👤 個人資訊
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border-l-4 border-purple-600 pl-4">
                                <p className="text-sm text-gray-500">姓名</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {session.user?.name || '未設定'}
                                </p>
                            </div>
                            <div className="border-l-4 border-blue-600 pl-4">
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {session.user?.email || '未設定'}
                                </p>
                            </div>
                            <div className="border-l-4 border-green-600 pl-4">
                                <p className="text-sm text-gray-500">登入方式</p>
                                <p className="text-lg font-semibold text-gray-900 capitalize">
                                    {session.user?.provider || 'Unknown'}
                                </p>
                            </div>
                            <div className="border-l-4 border-yellow-600 pl-4">
                                <p className="text-sm text-gray-500">Student ID</p>
                                <p className="text-lg font-mono font-semibold text-gray-900">
                                    {session.user?.studentId ||
                                        (typeof window !== 'undefined' ? localStorage.getItem('studentId') : null) ||
                                        '❌ 未設定'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">📚</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                我的課程
                            </h3>
                            <p className="text-gray-600 mb-4">查看已購買的課程和進度</p>
                            <button
                                onClick={() => router.push('/courses')}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition font-semibold">
                                查看課程
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">🛒</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                購買課程
                            </h3>
                            <p className="text-gray-600 mb-4">選購適合您的滑板課程</p>
                            <button
                                onClick={() => router.push('/purchase')}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold">
                                立即購買
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">📅</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                預約課程
                            </h3>
                            <p className="text-gray-600 mb-4">預約您的上課時段</p>
                            <button
                                onClick={() => router.push('/courses')}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold">
                                開始預約
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
