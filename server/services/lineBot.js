import { Client } from '@line/bot-sdk';
import googleSheets from './googleSheets.js';
import { addDays, format } from 'date-fns';

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new Client(config);

class LineBotService {
    async handleEvent(event) {
        if (event.type === 'message' && event.message.type === 'text') {
            return this.handleTextMessage(event);
        }

        if (event.type === 'postback') {
            return this.handlePostback(event);
        }

        return null;
    }

    async handleTextMessage(event) {
        const userId = event.source.userId;
        const userMessage = event.message.text.toLowerCase();

        // 檢查用戶是否已註冊
        let student = await googleSheets.getStudentByLineUserId(userId);

        if (!student) {
            // 新用戶，歡迎訊息
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '👋 歡迎來到極限滑板學校！\n\n您尚未註冊，請聯繫我們的工作人員完成報名手續。'
            });
        }

        // 主選單
        return this.sendMainMenu(event.replyToken, student.student_name);
    }

    async sendMainMenu(replyToken, studentName) {
        const flexMessage = {
            type: 'flex',
            altText: '主選單',
            contents: {
                type: 'bubble',
                hero: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '🛹 極限滑板學校',
                            weight: 'bold',
                            size: 'xl',
                            color: '#ffffff'
                        },
                        {
                            type: 'text',
                            text: `👋 ${studentName}，歡迎回來！`,
                            size: 'sm',
                            color: '#ffffff',
                            margin: 'md'
                        }
                    ],
                    backgroundColor: '#6C5CE7',
                    paddingAll: '20px'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '請選擇服務：',
                            weight: 'bold',
                            size: 'md',
                            margin: 'md'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            color: '#00B894',
                            action: {
                                type: 'postback',
                                label: '📅 預約課程',
                                data: 'action=book_class'
                            }
                        },
                        {
                            type: 'button',
                            style: 'primary',
                            color: '#0984E3',
                            action: {
                                type: 'postback',
                                label: '📋 查詢課程',
                                data: 'action=view_bookings'
                            }
                        }
                    ]
                }
            }
        };

        return client.replyMessage(replyToken, flexMessage);
    }

    async handlePostback(event) {
        const userId = event.source.userId;
        const data = new URLSearchParams(event.postback.data);
        const action = data.get('action');

        const student = await googleSheets.getStudentByLineUserId(userId);
        if (!student) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '請先完成註冊手續。'
            });
        }

        switch (action) {
            case 'book_class':
                return this.handleBookClass(event, student);
            case 'view_bookings':
                return this.handleViewBookings(event, student);
            case 'select_course':
                return this.handleSelectCourse(event, student, data);
            case 'select_date':
                return this.handleSelectDate(event, student, data);
            case 'confirm_booking':
                return this.handleConfirmBooking(event, student, data);
            default:
                return null;
        }
    }

    async handleBookClass(event, student) {
        // 獲取學生的活躍課程
        const courses = await googleSheets.getActiveCoursesByStudentId(student.student_id);

        if (courses.length === 0) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '您目前沒有可用的課程。\n請聯繫我們購買課程。'
            });
        }

        // 只顯示1對1課程供預約
        const oneOnOneCourses = courses.filter(c => c.course_type === '1對1');

        if (oneOnOneCourses.length === 0) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '您目前沒有可預約的1對1課程。\n團體課程時間已固定安排。'
            });
        }

        // 選擇課程
        const buttons = oneOnOneCourses.map(course => ({
            type: 'button',
            style: 'primary',
            action: {
                type: 'postback',
                label: `${course.coach} - 剩餘${course.remaining_sessions}堂`,
                data: `action=select_course&course_id=${course.course_id}&coach=${course.coach}`
            }
        }));

        const flexMessage = {
            type: 'flex',
            altText: '選擇課程',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '選擇要預約的課程',
                            weight: 'bold',
                            size: 'lg',
                            color: '#ffffff'
                        }
                    ],
                    backgroundColor: '#6C5CE7',
                    paddingAll: '15px'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: buttons
                }
            }
        };

        return client.replyMessage(event.replyToken, flexMessage);
    }

    async handleSelectCourse(event, student, data) {
        const courseId = data.get('course_id');
        const coach = data.get('coach');

        // 顯示未來7天可選擇
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            const date = addDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayOfWeek = format(date, 'EEE');
            const displayDate = `${format(date, 'MM/dd')} (${dayOfWeek})`;

            dates.push({
                type: 'button',
                style: 'link',
                action: {
                    type: 'postback',
                    label: displayDate,
                    data: `action=select_date&course_id=${courseId}&coach=${coach}&date=${dateStr}`
                }
            });
        }

        const flexMessage = {
            type: 'flex',
            altText: '選擇日期',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '選擇上課日期',
                            weight: 'bold',
                            size: 'lg',
                            color: '#ffffff'
                        }
                    ],
                    backgroundColor: '#6C5CE7',
                    paddingAll: '15px'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: dates,
                    spacing: 'sm'
                }
            }
        };

        return client.replyMessage(event.replyToken, flexMessage);
    }

    async handleSelectDate(event, student, data) {
        const courseId = data.get('course_id');
        const coach = data.get('coach');
        const date = data.get('date');

        // 獲取該日期的可用時段
        const schedules = await googleSheets.getAvailableSchedules(date, coach);

        if (schedules.length === 0) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '抱歉，該日期沒有可用時段。\n請選擇其他日期。'
            });
        }

        const buttons = schedules.map(schedule => ({
            type: 'button',
            style: 'primary',
            action: {
                type: 'postback',
                label: schedule.time_slot,
                data: `action=confirm_booking&course_id=${courseId}&schedule_id=${schedule.schedule_id}&date=${date}&time=${schedule.time_slot}&coach=${coach}`
            }
        }));

        const flexMessage = {
            type: 'flex',
            altText: '選擇時段',
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: `${date} 可用時段`,
                            weight: 'bold',
                            size: 'lg',
                            color: '#ffffff'
                        }
                    ],
                    backgroundColor: '#6C5CE7',
                    paddingAll: '15px'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: buttons,
                    spacing: 'sm'
                }
            }
        };

        return client.replyMessage(event.replyToken, flexMessage);
    }

    async handleConfirmBooking(event, student, data) {
        const courseId = data.get('course_id');
        const scheduleId = data.get('schedule_id');
        const date = data.get('date');
        const timeSlot = data.get('time');
        const coach = data.get('coach');

        try {
            // 創建預約
            const booking = await googleSheets.createBooking(
                courseId,
                student.student_id,
                date,
                timeSlot,
                coach
            );

            // 標記時段為已預約
            await googleSheets.markScheduleAsBooked(scheduleId, booking.booking_id);

            // 獲取更新後的課程資訊
            const courses = await googleSheets.getActiveCoursesByStudentId(student.student_id);
            const course = courses.find(c => c.course_id === courseId);

            const successMessage = {
                type: 'flex',
                altText: '預約成功',
                contents: {
                    type: 'bubble',
                    header: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '✅ 預約成功！',
                                weight: 'bold',
                                size: 'xl',
                                color: '#ffffff'
                            }
                        ],
                        backgroundColor: '#00B894',
                        paddingAll: '20px'
                    },
                    body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '課程資訊',
                                weight: 'bold',
                                size: 'lg',
                                margin: 'md'
                            },
                            {
                                type: 'separator',
                                margin: 'md'
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                margin: 'lg',
                                spacing: 'sm',
                                contents: [
                                    {
                                        type: 'box',
                                        layout: 'baseline',
                                        spacing: 'sm',
                                        contents: [
                                            {
                                                type: 'text',
                                                text: '教練',
                                                color: '#aaaaaa',
                                                size: 'sm',
                                                flex: 1
                                            },
                                            {
                                                type: 'text',
                                                text: coach,
                                                wrap: true,
                                                color: '#666666',
                                                size: 'sm',
                                                flex: 3
                                            }
                                        ]
                                    },
                                    {
                                        type: 'box',
                                        layout: 'baseline',
                                        spacing: 'sm',
                                        contents: [
                                            {
                                                type: 'text',
                                                text: '日期',
                                                color: '#aaaaaa',
                                                size: 'sm',
                                                flex: 1
                                            },
                                            {
                                                type: 'text',
                                                text: date,
                                                wrap: true,
                                                color: '#666666',
                                                size: 'sm',
                                                flex: 3
                                            }
                                        ]
                                    },
                                    {
                                        type: 'box',
                                        layout: 'baseline',
                                        spacing: 'sm',
                                        contents: [
                                            {
                                                type: 'text',
                                                text: '時間',
                                                color: '#aaaaaa',
                                                size: 'sm',
                                                flex: 1
                                            },
                                            {
                                                type: 'text',
                                                text: timeSlot,
                                                wrap: true,
                                                color: '#666666',
                                                size: 'sm',
                                                flex: 3
                                            }
                                        ]
                                    },
                                    {
                                        type: 'box',
                                        layout: 'baseline',
                                        spacing: 'sm',
                                        contents: [
                                            {
                                                type: 'text',
                                                text: '剩餘堂數',
                                                color: '#aaaaaa',
                                                size: 'sm',
                                                flex: 1
                                            },
                                            {
                                                type: 'text',
                                                text: `${course?.remaining_sessions || 0} 堂`,
                                                wrap: true,
                                                color: '#666666',
                                                size: 'sm',
                                                flex: 3
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            return client.replyMessage(event.replyToken, successMessage);
        } catch (error) {
            console.error('Booking error:', error);
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '預約失敗，請稍後再試或聯繫工作人員。'
            });
        }
    }

    async handleViewBookings(event, student) {
        const bookings = await googleSheets.getBookingsByStudentId(student.student_id);
        const courses = await googleSheets.getActiveCoursesByStudentId(student.student_id);

        // 只顯示未來的預約
        const upcomingBookings = bookings
            .filter(b => b.status === 'scheduled' && new Date(b.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let contents = [
            {
                type: 'text',
                text: '📋 我的課程',
                weight: 'bold',
                size: 'lg',
                margin: 'md'
            },
            {
                type: 'separator',
                margin: 'md'
            }
        ];

        // 顯示剩餘堂數
        if (courses.length > 0) {
            contents.push({
                type: 'text',
                text: '剩餘堂數',
                weight: 'bold',
                size: 'md',
                margin: 'lg'
            });

            courses.forEach(course => {
                contents.push({
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    margin: 'md',
                    contents: [
                        {
                            type: 'text',
                            text: `${course.coach} (${course.course_type})`,
                            color: '#666666',
                            size: 'sm',
                            flex: 3
                        },
                        {
                            type: 'text',
                            text: `${course.remaining_sessions}堂`,
                            color: '#00B894',
                            size: 'sm',
                            flex: 1,
                            align: 'end'
                        }
                    ]
                });
            });
        }

        // 顯示即將到來的預約
        if (upcomingBookings.length > 0) {
            contents.push(
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'text',
                    text: '即將到來的課程',
                    weight: 'bold',
                    size: 'md',
                    margin: 'lg'
                }
            );

            upcomingBookings.slice(0, 5).forEach(booking => {
                contents.push({
                    type: 'box',
                    layout: 'vertical',
                    margin: 'md',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: `📅 ${booking.date}`,
                            color: '#6C5CE7',
                            size: 'sm',
                            weight: 'bold'
                        },
                        {
                            type: 'text',
                            text: `⏰ ${booking.time_slot} | 👨‍🏫 ${booking.coach}`,
                            color: '#666666',
                            size: 'xs'
                        }
                    ]
                });
            });
        } else {
            contents.push({
                type: 'text',
                text: '目前沒有預約的課程',
                color: '#999999',
                size: 'sm',
                margin: 'lg'
            });
        }

        const flexMessage = {
            type: 'flex',
            altText: '我的課程',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents
                }
            }
        };

        return client.replyMessage(event.replyToken, flexMessage);
    }
}

export default new LineBotService();
