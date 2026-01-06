'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Coach {
    coach_id: string;
    coach_name: string;
    status: string;
}

export default function PurchasePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [courseType, setCourseType] = useState<'1對1' | '團課'>('1對1');
    const [selectedCoach, setSelectedCoach] = useState('');
    const [totalSessions, setTotalSessions] = useState(4);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchCoaches();
        }
    }, [status, router]);

    const fetchCoaches = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/coaches');
            const data = await response.json();
            setCoaches(data);
            if (data.length > 0) {
                setSelectedCoach(data[0].coach_name);
            }
        } catch (error) {
            console.error('Error fetching coaches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        const studentId = (session?.user as any)?.studentId || localStorage.getItem('studentId');

        if (!studentId) {
            alert('無法取得學生 ID，請重新登入');
            return;
        }

        if (!selectedCoach) {
            alert('請選擇教練');
            return;
        }

        setPurchasing(true);

        try {
            const response = await fetch('http://localhost:3000/api/student/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    courseType,
                    coach: selectedCoach,
                    totalSessions,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Course purchased:', data);
                alert('課程購買成功！');
                router.push('/courses');
            } else {
                const error = await response.json();
                alert('購買失敗：' + (error.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('Error purchasing course:', error);
            alert('購買過程發生錯誤');
        } finally {
            setPurchasing(false);
        }
    };

    const sessionOptions = [4, 8, 12, 16, 20, 24];
    const pricePerSession = courseType === '1對1' ? 1200 : 800;
    const totalPrice = pricePerSession * totalSessions;
    const validity = courseType === '1對1' ? '3個月' : '無期限';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button onClick={() => router.push('/dashboard')} className="text-2xl mr-2">←</button>
                            <span className="text-2xl">🛹</span>
                            <h1 className="ml-2 text-xl font-bold text-gray-900">購買課程</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {/* Course Type Selection */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">選擇課程類型</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setCourseType('1對1')}
                                className={`p-6 rounded-lg border-2 transition-all ${courseType === '1對1'
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-gray-300 hover:border-purple-300'
                                    }`}
                            >
                                <div className="text-4xl mb-2">👨‍🏫</div>
                                <h3 className="text-lg font-semibold mb-1">1對1 課程</h3>
                                <p className="text-sm text-gray-600">個人化教學，快速進步</p>
                                <p className="text-purple-600 font-bold mt-2">NT$ 1,200 / 堂</p>
                                <p className="text-xs text-gray-500">有效期：3個月</p>
                            </button>

                            <button
                                onClick={() => setCourseType('團課')}
                                className={`p-6 rounded-lg border-2 transition-all ${courseType === '團課'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <div className="text-4xl mb-2">👥</div>
                                <h3 className="text-lg font-semibold mb-1">團體課程</h3>
                                <p className="text-sm text-gray-600">團體學習，互相激勵</p>
                                <p className="text-blue-600 font-bold mt-2">NT$ 800 / 堂</p>
                                <p className="text-xs text-gray-500">有效期：無期限</p>
                            </button>
                        </div>
                    </div>

                    {/* Coach Selection */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">選擇教練</h2>
                        <select
                            value={selectedCoach}
                            onChange={(e) => setSelectedCoach(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        >
                            {coaches.map((coach) => (
                                <option key={coach.coach_id} value={coach.coach_name}>
                                    {coach.coach_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Session Count Selection */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">選擇堂數</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {sessionOptions.map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setTotalSessions(count)}
                                    className={`p-4 rounded-lg border-2 transition-all ${totalSessions === count
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-300 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                                    <div className="text-xs text-gray-500">堂</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                        <h2 className="text-xl font-bold mb-4">購買總結</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>課程類型</span>
                                <span className="font-semibold">{courseType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>教練</span>
                                <span className="font-semibold">{selectedCoach}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>總堂數</span>
                                <span className="font-semibold">{totalSessions} 堂</span>
                            </div>
                            <div className="flex justify-between">
                                <span>單價</span>
                                <span className="font-semibold">NT$ {pricePerSession.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>有效期限</span>
                                <span className="font-semibold">{validity}</span>
                            </div>
                            <div className="border-t border-white/30 pt-2 mt-2">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>總金額</span>
                                    <span>NT$ {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                        onClick={handlePurchase}
                        disabled={purchasing || !selectedCoach}
                        className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {purchasing ? '處理中...' : '確認購買'}
                    </button>
                </div>
            </main>
        </div>
    );
}
