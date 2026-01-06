'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

interface Booking {
    booking_id: string;
    course_id: string;
    student_id: string;
    date: string;
    time_slot: string;
    coach: string;
    verification_code: string;
    status: string;
    created_at: string;
}

export default function ReservationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchBookings();
        }
    }, [status, router]);

    const fetchBookings = async () => {
        try {
            const studentId = (session?.user as any)?.studentId || localStorage.getItem('studentId');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/student/bookings?studentId=${studentId}`);
            const data = await response.json();
            setBookings(data);

            // 為每個預約生成 QR Code
            const codes: Record<string, string> = {};
            for (const booking of data) {
                if (booking.verification_code) {
                    const qrDataUrl = await QRCode.toDataURL(booking.verification_code, {
                        width: 200,
                        margin: 2,
                    });
                    codes[booking.booking_id] = qrDataUrl;
                }
            }
            setQrCodes(codes);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        });
    };

    const isUpcoming = (dateString: string) => {
        return new Date(dateString) >= new Date();
    };

    const isPast = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const upcomingBookings = bookings.filter(b => isUpcoming(b.date) && b.status !== 'cancelled');
    const pastBookings = bookings.filter(b => isPast(b.date) || b.status === 'cancelled');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button onClick={() => router.push('/dashboard')} className="text-2xl mr-2">←</button>
                            <span className="text-2xl">🛹</span>
                            <h1 className="ml-2 text-xl font-bold text-gray-900">我的預約</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">還沒有預約記錄</h3>
                            <p className="text-gray-600 mb-6">預約您的第一堂課吧！</p>
                            <button
                                onClick={() => router.push('/courses')}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                            >
                                查看我的課程
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Upcoming Bookings */}
                            {upcomingBookings.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">即將到來</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {upcomingBookings.map((booking) => (
                                            <div
                                                key={booking.booking_id}
                                                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                            >
                                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm opacity-90">教練</p>
                                                            <p className="text-xl font-bold">{booking.coach}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm opacity-90">時間</p>
                                                            <p className="text-xl font-bold">{booking.time_slot}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-sm">{formatDate(booking.date)}</p>
                                                </div>

                                                <div className="p-6">
                                                    {/* QR Code */}
                                                    {qrCodes[booking.booking_id] && (
                                                        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                                                            <img
                                                                src={qrCodes[booking.booking_id]}
                                                                alt="Verification QR Code"
                                                                className="mx-auto mb-3"
                                                            />
                                                            <div className="text-3xl font-mono font-bold text-purple-600 tracking-wider">
                                                                {booking.verification_code.slice(0, 3)} {booking.verification_code.slice(3)}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-2">核銷碼</p>
                                                        </div>
                                                    )}

                                                    <div className="text-sm text-gray-600">
                                                        <p>預約編號：{booking.booking_id.slice(0, 8)}</p>
                                                        <p>預約時間：{new Date(booking.created_at).toLocaleString('zh-TW')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Past Bookings */}
                            {pastBookings.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">歷史記錄</h2>
                                    <div className="space-y-3">
                                        {pastBookings.map((booking) => (
                                            <div
                                                key={booking.booking_id}
                                                className="bg-white rounded-lg shadow p-4 opacity-75"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {formatDate(booking.date)} - {booking.time_slot}
                                                        </p>
                                                        <p className="text-sm text-gray-600">教練：{booking.coach}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {booking.status === 'cancelled' ? (
                                                            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                                                                已取消
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold">
                                                                已完成
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
