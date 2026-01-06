'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Course {
    course_id: string;
    course_type: string;
    coach: string;
    remaining_sessions: number;
    expiry_date: string;
}

interface Schedule {
    schedule_id: string;
    coach: string;
    date: string;
    time_slot: string;
    is_available: boolean;
}

export default function BookingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchCourseAndSchedules();
        }
    }, [status, router]);

    const fetchCourseAndSchedules = async () => {
        try {
            setLoading(true);
            const studentId = (session?.user as any)?.studentId || localStorage.getItem('studentId');

            // 取得課程資訊
            const coursesRes = await fetch(`http://localhost:3000/api/student/courses?studentId=${studentId}`);
            const courses = await coursesRes.json();
            const currentCourse = courses.find((c: Course) => c.course_id === courseId);

            if (!currentCourse) {
                alert('找不到課程');
                router.push('/courses');
                return;
            }

            setCourse(currentCourse);

            // 取得教練的可用時段（未來30天）
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 30);

            const schedulesRes = await fetch(`http://localhost:3000/api/schedules?coach=${currentCourse.coach}`);
            const allSchedules = await schedulesRes.json();

            // 篩選未來的可用時段
            const futureSchedules = allSchedules.filter((s: Schedule) => {
                const scheduleDate = new Date(s.date);
                return scheduleDate >= today && scheduleDate <= endDate && s.is_available;
            });

            setSchedules(futureSchedules);

            // 設定預設日期為今天
            setSelectedDate(today.toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (scheduleId: string) => {
        const studentId = (session?.user as any)?.studentId || localStorage.getItem('studentId');

        if (!studentId || !course) return;

        setBooking(true);

        try {
            const response = await fetch('http://localhost:3000/api/student/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.course_id,
                    scheduleId,
                    studentId,
                }),
            });

            if (response.ok) {
                alert('預約成功！');
                router.push('/reservations');
            } else {
                const error = await response.json();
                alert('預約失敗：' + (error.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('Error booking:', error);
            alert('預約過程發生錯誤');
        } finally {
            setBooking(false);
        }
    };

    // 按日期分組時段
    const groupedSchedules = schedules.reduce((acc, schedule) => {
        if (!acc[schedule.date]) {
            acc[schedule.date] = [];
        }
        acc[schedule.date].push(schedule);
        return acc;
    }, {} as Record<string, Schedule[]>);

    const dates = Object.keys(groupedSchedules).sort();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!course) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button onClick={() => router.push('/courses')} className="text-2xl mr-2">←</button>
                            <span className="text-2xl">🛹</span>
                            <h1 className="ml-2 text-xl font-bold text-gray-900">預約課程</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {/* Course Info */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">課程資訊</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">課程類型</p>
                                <p className="text-lg font-semibold">{course.course_type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">教練</p>
                                <p className="text-lg font-semibold">{course.coach}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">剩餘堂數</p>
                                <p className="text-lg font-semibold text-purple-600">{course.remaining_sessions} 堂</p>
                            </div>
                            {course.expiry_date && (
                                <div>
                                    <p className="text-sm text-gray-500">有效期限</p>
                                    <p className="text-lg font-semibold">{course.expiry_date}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Schedules */}
                    {dates.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">目前沒有可用時段</h3>
                            <p className="text-gray-600">請聯繫教練安排時間</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {dates.map((date) => (
                                <div key={date} className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        📅 {new Date(date).toLocaleDateString('zh-TW', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            weekday: 'short'
                                        })}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {groupedSchedules[date].map((schedule) => (
                                            <button
                                                key={schedule.schedule_id}
                                                onClick={() => handleBook(schedule.schedule_id)}
                                                disabled={booking}
                                                className="p-4 border-2 border-purple-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="text-center">
                                                    <div className="text-xl font-bold text-gray-900">
                                                        {schedule.time_slot}
                                                    </div>
                                                    <div className="text-xs text-green-600 mt-1">
                                                        ✓ 可預約
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
