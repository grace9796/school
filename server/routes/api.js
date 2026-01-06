import express from 'express';
import googleSheets from '../services/googleSheets.js';

const router = express.Router();

// ========== Students API ==========
router.get('/students', async (req, res) => {
    try {
        const students = await googleSheets.getAllStudents();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/students', async (req, res) => {
    try {
        const { line_user_id, student_name, contact_name, contact_phone, notes } = req.body;
        const student = await googleSheets.createStudent(
            line_user_id,
            student_name,
            contact_name,
            contact_phone,
            notes
        );
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Auth Sync API =====
router.post('/auth/sync', async (req, res) => {
    try {
        const { auth_provider, auth_id, email, name, profile_image } = req.body;

        if (!auth_provider || !auth_id) {
            return res.status(400).json({ error: 'auth_provider and auth_id are required' });
        }

        // 查詢是否已存在相同 auth_id 和 auth_provider 的學生
        const students = await googleSheets.getAllStudents();
        const existingStudent = students.find(
            s => s.auth_id === auth_id && s.auth_provider === auth_provider
        );

        if (existingStudent) {
            console.log('Found existing student:', existingStudent.student_id);
            return res.json({ student_id: existingStudent.student_id });
        }

        // 建立新學生記錄
        console.log('Creating new student for auth:', { auth_provider, auth_id, name });
        const newStudent = await googleSheets.createStudent(
            auth_provider === 'line' ? auth_id : '', // line_user_id
            name || 'Unknown User',
            name || 'Unknown User',
            '',
            `Registered via ${auth_provider}`,
            auth_provider,
            auth_id,
            email || '',
            profile_image || ''
        );

        console.log('Created student:', newStudent.student_id);
        res.json({ student_id: newStudent.student_id });
    } catch (error) {
        console.error('Error in auth sync:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== Course Packages API ==========
router.get('/packages', async (req, res) => {
    try {
        const packages = await googleSheets.getAllCoursePackages();
        res.json(packages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/packages/active', async (req, res) => {
    try {
        const packages = await googleSheets.getActiveCoursePackages();
        res.json(packages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/packages', async (req, res) => {
    try {
        const { package_name, course_type, coach, total_sessions, validity_days, price, description } = req.body;
        const pkg = await googleSheets.createCoursePackage(
            package_name,
            course_type,
            coach,
            total_sessions,
            validity_days,
            price,
            description
        );
        res.json(pkg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/packages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const pkg = await googleSheets.updateCoursePackage(id, updates);
        res.json(pkg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/packages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await googleSheets.deleteCoursePackage(id);
        res.json(pkg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Coaches API ==========
router.get('/coaches', async (req, res) => {
    try {
        const coaches = await googleSheets.getAllCoaches();
        // Only return active coaches
        const activeCoaches = coaches.filter(c => c.status === 'active');
        res.json(activeCoaches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/coaches', async (req, res) => {
    try {
        const { coach_name } = req.body;
        const coach = await googleSheets.createCoach(coach_name);
        res.json(coach);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/coaches/:id', async (req, res) => {
    try {
        const coachId = req.params.id;
        await googleSheets.deleteCoach(coachId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Courses API ==========
router.get('/courses', async (req, res) => {
    try {
        const courses = await googleSheets.getAllCourses();

        // 加入學生資訊
        const students = await googleSheets.getAllStudents();
        const coursesWithStudentInfo = courses.map(course => {
            const student = students.find(s => s.student_id === course.student_id);
            return {
                ...course,
                student_name: student?.student_name || 'Unknown'
            };
        });

        res.json(coursesWithStudentInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/courses', async (req, res) => {
    try {
        const { student_id, course_type, coach, total_sessions, purchase_date } = req.body;
        const course = await googleSheets.createCourse(
            student_id,
            course_type,
            coach,
            total_sessions,
            purchase_date
        );
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Bookings API ==========
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await googleSheets.getAllBookings();

        // 加入學生資訊
        const students = await googleSheets.getAllStudents();
        const bookingsWithStudentInfo = bookings.map(booking => {
            const student = students.find(s => s.student_id === booking.student_id);
            return {
                ...booking,
                student_name: student?.student_name || 'Unknown'
            };
        });

        res.json(bookingsWithStudentInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/bookings', async (req, res) => {
    try {
        const { course_id, student_id, date, time_slot, coach, schedule_id } = req.body;

        const booking = await googleSheets.createBooking(
            course_id,
            student_id,
            date,
            time_slot,
            coach
        );

        if (schedule_id) {
            await googleSheets.markScheduleAsBooked(schedule_id, booking.booking_id);
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Schedule API ==========
router.get('/schedules', async (req, res) => {
    try {
        const schedules = await googleSheets.getAllSchedules();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/schedules', async (req, res) => {
    try {
        const { coach, date, time_slot } = req.body;
        const schedule = await googleSheets.createSchedule(coach, date, time_slot);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/schedules/batch', async (req, res) => {
    try {
        const { coach, dates, time_slots } = req.body;

        const schedules = [];
        for (const date of dates) {
            for (const timeSlot of time_slots) {
                const schedule = await googleSheets.createSchedule(coach, date, timeSlot);
                schedules.push(schedule);
            }
        }

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Available Slots API ==========
router.get('/available-slots', async (req, res) => {
    try {
        const { date, coach } = req.query;
        const schedules = await googleSheets.getAvailableSchedules(date, coach);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== 學生端 API =====

// 取得學生的所有課程
router.get('/student/courses', async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ error: 'studentId is required' });
        }

        const allCourses = await googleSheets.getAllCourses();
        const studentCourses = allCourses.filter(c => c.student_id === studentId);
        res.json(studentCourses);
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({ error: error.message });
    }
});

// 取得學生的所有預約
router.get('/student/bookings', async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ error: 'studentId is required' });
        }

        const allBookings = await googleSheets.getAllBookings();
        const studentBookings = allBookings.filter(b => b.student_id === studentId);

        // 按日期排序（最新的在前）
        studentBookings.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(studentBookings);
    } catch (error) {
        console.error('Error fetching student bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// 購買課程
router.post('/student/purchase', async (req, res) => {
    try {
        const { studentId, courseType, coach, totalSessions } = req.body;

        if (!studentId || !courseType || !coach || !totalSessions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 計算有效期（1對1課程為購買日+100天）
        let expiryDate = '';
        if (courseType === '1對1') {
            const purchaseDate = new Date();
            const expiry = new Date(purchaseDate);
            expiry.setDate(expiry.getDate() + 100); // 100 calendar days
            expiryDate = expiry.toISOString().split('T')[0]; // YYYY-MM-DD format
        }

        const course = await googleSheets.createCourse(
            studentId,
            courseType,
            coach,
            totalSessions,
            totalSessions, // remaining_sessions = total_sessions
            expiryDate
        );

        res.json(course);
    } catch (error) {
        console.error('Error purchasing course:', error);
        res.status(500).json({ error: error.message });
    }
});

// 預約課程
router.post('/student/book', async (req, res) => {
    try {
        const { courseId, scheduleId, studentId } = req.body;

        if (!courseId || !scheduleId || !studentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 產生6位數核銷碼
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 取得時段資訊
        const schedules = await googleSheets.getAllSchedules();
        const schedule = schedules.find(s => s.schedule_id === scheduleId);

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        // 建立預約
        const booking = await googleSheets.createBookingWithCode(
            courseId,
            studentId,
            schedule.date,
            schedule.time_slot,
            schedule.coach,
            verificationCode
        );

        // 更新時段狀態
        await googleSheets.updateSchedule(scheduleId, {
            is_available: false,
            booking_id: booking.booking_id
        });

        // 更新課程剩餘堂數
        const courses = await googleSheets.getAllCourses();
        const course = courses.find(c => c.course_id === courseId);
        if (course) {
            const newRemaining = parseInt(course.remaining_sessions) - 1;
            await googleSheets.updateCourse(courseId, {
                remaining_sessions: newRemaining
            });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error booking class:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
