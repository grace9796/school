'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
    course_id: string;
    student_id: string;
    course_type: string;
    coach: string;
    total_sessions: number;
    remaining_sessions: number;
    purchase_date: string;
    expiry_date: string;
    status: string;
}

export default function CoursesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const studentId = (session?.user as any)?.studentId;
            if (studentId) {
                fetchCourses();
            } else {
                // 沒有 studentId，顯示空狀態
                console.warn('No studentId found in session');
                setLoading(false);
            }
        }
    }, [status, session, router]);

    const fetchCourses = async () => {
        try {
            const studentId = (session?.user as any)?.studentId;
            console.log('Fetching courses for studentId:', studentId);

            if (!studentId) {
                console.error('No studentId available');
                setLoading(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const url = `${apiUrl}/api/student/courses?studentId=${studentId}`;
            console.log('Fetching from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Courses data:', data);
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = (remaining: number, total: number) => {
        const used = total - remaining;
        return (used / total) * 100;
    };

    const isExpiringSoon = (expiryDate: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isExpired = (expiryDate: string) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

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
                            <h1 className="ml-2 text-xl font-bold text-gray-900">我的課程</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/purchase')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                購買課程
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {courses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">還沒有課程</h3>
                            <p className="text-gray-600 mb-6">開始購買您的第一堂滑板課程吧！</p>
                            <button
                                onClick={() => router.push('/purchase')}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                            >
                                立即購買課程
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => {
                                const progress = getProgressPercentage(
                                    parseInt(course.remaining_sessions.toString()),
                                    parseInt(course.total_sessions.toString())
                                );
                                const expiring = isExpiringSoon(course.expiry_date);
                                const expired = isExpired(course.expiry_date);

                                return (
                                    <div
                                        key={course.course_id}
                                        className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${expired ? 'opacity-75' : ''
                                            }`}
                                    >
                                        {/* Card Header */}
                                        <div className={`p-6 ${expired ? 'bg-gray-400' :
                                            course.course_type === '1對1' ? 'bg-purple-600' : 'bg-blue-600'
                                            }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">
                                                        {course.course_type}
                                                    </h3>
                                                    <p className="text-white opacity-90">
                                                        教練：{course.coach}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-white">
                                                        {course.remaining_sessions}
                                                    </div>
                                                    <div className="text-xs text-white opacity-75">
                                                        剩餘堂數
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-6">
                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>已使用 {parseInt(course.total_sessions.toString()) - parseInt(course.remaining_sessions.toString())} / {course.total_sessions} 堂</span>
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${expired ? 'bg-gray-400' :
                                                            progress < 50 ? 'bg-green-500' :
                                                                progress < 80 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Course Info */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">購買日期</span>
                                                    <span className="font-semibold">{course.purchase_date}</span>
                                                </div>
                                                {course.expiry_date && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">有效期限</span>
                                                        <span className={`font-semibold ${expired ? 'text-red-600' :
                                                            expiring ? 'text-orange-600' : ''
                                                            }`}>
                                                            {course.expiry_date}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Warning/Status Messages */}
                                            {expired && (
                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-red-600 text-sm font-semibold">
                                                        ⚠️ 課程已過期
                                                    </p>
                                                </div>
                                            )}
                                            {expiring && !expired && (
                                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <p className="text-orange-600 text-sm font-semibold">
                                                        ⏰ 即將到期，請盡快預約
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            {!expired && parseInt(course.remaining_sessions.toString()) > 0 && (
                                                <button
                                                    onClick={() => router.push(`/booking/${course.course_id}`)}
                                                    className="mt-4 w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition font-semibold"
                                                >
                                                    立即預約
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
