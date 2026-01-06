import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Google Sheets API...');

      // Support both Base64 credentials (production) and local JSON file (development)
      let credentials;
      if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        console.log('📦 Using Base64 credentials from environment');
        credentials = JSON.parse(
          Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString()
        );
      } else {
        console.log('📄 Using local credentials file');
        const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
        if (!fs.existsSync(credentialsPath)) {
          throw new Error('google-credentials.json not found. Please follow setup instructions in README.md');
        }
        credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      }

      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });

      console.log('✅ Google Sheets API initialized successfully');

      // 初始化時檢查工作表結構
      await this.ensureSheetsExist();
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error.message);
      throw error;
    }
  }

  async ensureSheetsExist() {
    try {
      const sheets = ['Students', 'Courses', 'Bookings', 'CoachSchedule', 'Coaches', 'Settings', 'CoursePackages'];

      // Get all existing sheets
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);

      // Students sheet - Add OAuth columns
      if (!existingSheets.includes('Students')) {
        await this.createSheet('Students', [
          'student_id', 'line_user_id', 'student_name', 'contact_name', 'contact_phone', 'notes',
          'auth_provider', 'auth_id', 'email', 'profile_image', 'created_at'
        ]);
      } else {
        // Ensure headers are correct for existing Students sheet
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Students!A1:K1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'student_id', 'line_user_id', 'student_name', 'contact_name', 'contact_phone', 'notes',
              'auth_provider', 'auth_id', 'email', 'profile_image', 'created_at'
            ]]
          }
        });
      }

      // Create other sheets if they don't exist and set their headers
      const headers = {
        Courses: ['course_id', 'student_id', 'course_type', 'coach', 'total_sessions', 'remaining_sessions', 'purchase_date', 'expiry_date', 'status', 'created_at'],
        Bookings: ['booking_id', 'course_id', 'student_id', 'date', 'time_slot', 'coach', 'status', 'verification_code', 'verified_at', 'verified_by', 'created_at', 'updated_at'],
        CoachSchedule: ['schedule_id', 'coach', 'date', 'time_slot', 'is_available', 'booking_id'],
        Coaches: ['coach_id', 'coach_name', 'status', 'created_at'],
        Settings: ['setting_key', 'setting_value', 'description'],
        CoursePackages: ['package_id', 'package_name', 'description', 'price', 'sessions_included', 'validity_days', 'created_at']
      };

      for (const sheetName of sheets) {
        if (sheetName === 'Students') continue; // Already handled

        if (!existingSheets.includes(sheetName)) {
          console.log(`Creating sheet: ${sheetName}`);
          await this.createSheet(sheetName, headers[sheetName]);
        } else {
          // Ensure headers are correct for existing sheets
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headers[sheetName]]
            }
          });
        }
      }

    } catch (error) {
      console.error('Error ensuring sheet structure:', error.message);
    }
  }

  async createSheet(sheetName, headerRow = []) {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: sheetName }
          }
        }]
      }
    });

    if (headerRow.length > 0) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headerRow]
        }
      });
    }
  }

  // The setupHeaders method is now integrated into ensureSheetsExist and createSheet,
  // but keeping it for now if there's other logic that relies on it.
  // It might be removed in a future refactor.
  async setupHeaders() {
    const headers = {
      Students: ['student_id', 'line_user_id', 'student_name', 'contact_name', 'contact_phone', 'notes', 'auth_provider', 'auth_id', 'email', 'profile_image', 'created_at'],
      Courses: ['course_id', 'student_id', 'course_type', 'coach', 'total_sessions', 'remaining_sessions', 'purchase_date', 'expiry_date', 'status', 'created_at'],
      Bookings: ['booking_id', 'course_id', 'student_id', 'date', 'time_slot', 'coach', 'status', 'verification_code', 'verified_at', 'verified_by', 'created_at', 'updated_at'],
      CoachSchedule: ['schedule_id', 'coach', 'date', 'time_slot', 'is_available', 'booking_id'],
      Coaches: ['coach_id', 'coach_name', 'status', 'created_at'],
      Settings: ['setting_key', 'setting_value', 'description'],
      CoursePackages: ['package_id', 'package_name', 'description', 'price', 'sessions_included', 'validity_days', 'created_at']
    };

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      try {
        // 檢查是否已有標題
        const firstRow = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1:Z1`,
        });

        if (!firstRow.data.values || firstRow.data.values.length === 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headerRow]
            }
          });
        }
      } catch (error) {
        console.error(`Error setting up headers for ${sheetName}:`, error.message);
      }
    }
  }

  // ========== Students ==========
  async getStudentByLineUserId(lineUserId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Students!A2:G',
    });

    const rows = response.data.values || [];
    const student = rows.find(row => row[1] === lineUserId);

    if (student) {
      return {
        student_id: student[0],
        line_user_id: student[1],
        student_name: student[2],
        contact_name: student[3],
        contact_phone: student[4],
        notes: student[5],
        created_at: student[6]
      };
    }
    return null;
  }

  async createStudent(lineUserId, studentName, contactName, contactPhone, notes = '', authProvider = '', authId = '', email = '', profileImage = '') {
    const studentId = uuidv4();
    const createdAt = new Date().toISOString();
    // Allow lineUserId to be optional (empty string or null)
    const lineUserIdValue = lineUserId || '';

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Students!A:K',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          studentId,
          lineUserIdValue,
          studentName,
          contactName,
          contactPhone,
          notes,
          authProvider || '',
          authId || '',
          email || '',
          profileImage || '',
          createdAt
        ]]
      }
    });

    return {
      student_id: studentId,
      line_user_id: lineUserIdValue,
      student_name: studentName,
      auth_provider: authProvider,
      auth_id: authId,
      email: email
    };
  }

  async getAllStudents() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Students!A2:G',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      student_id: row[0],
      line_user_id: row[1],
      student_name: row[2],
      contact_name: row[3],
      contact_phone: row[4],
      notes: row[5],
      created_at: row[6]
    }));
  }

  // ========== Coaches ==========
  async getAllCoaches() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Coaches!A2:D',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      coach_id: row[0],
      coach_name: row[1],
      status: row[2] || 'active',
      created_at: row[3]
    }));
  }

  async createCoach(coachName) {
    const coachId = uuidv4();
    const createdAt = new Date().toISOString();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Coaches!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[coachId, coachName, 'active', createdAt]]
      }
    });

    return { coach_id: coachId, coach_name: coachName };
  }

  async deleteCoach(coachId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Coaches!A2:D',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === coachId);

    if (rowIndex !== -1) {
      // Mark as inactive instead of deleting
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Coaches!C${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['inactive']]
        }
      });
    }
  }

  // ========== Courses ==========
  async createCourse(studentId, courseType, coach, totalSessions, remainingSessions, expiryDate) {
    const courseId = uuidv4();
    const purchaseDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const status = 'active';
    const createdAt = new Date().toISOString();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Courses!A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          courseId,
          studentId,
          courseType,
          coach,
          totalSessions,
          remainingSessions,
          purchaseDate,
          expiryDate || '', // Can be empty for group courses
          status,
          createdAt
        ]]
      }
    });

    return {
      course_id: courseId,
      student_id: studentId,
      course_type: courseType,
      coach: coach,
      total_sessions: totalSessions,
      remaining_sessions: remainingSessions,
      purchase_date: purchaseDate,
      expiry_date: expiryDate || '',
      status: status,
      created_at: createdAt
    };
  }

  async getActiveCoursesByStudentId(studentId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Courses!A2:J',
    });

    const rows = response.data.values || [];
    return rows
      .filter(row => row[1] === studentId && row[8] === 'active')
      .map(row => ({
        course_id: row[0],
        student_id: row[1],
        course_type: row[2],
        coach: row[3],
        total_sessions: parseInt(row[4]),
        remaining_sessions: parseInt(row[5]),
        purchase_date: row[6],
        expiry_date: row[7],
        status: row[8],
        created_at: row[9]
      }));
  }

  async getAllCourses() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Courses!A2:J',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      course_id: row[0],
      student_id: row[1],
      course_type: row[2],
      coach: row[3],
      total_sessions: parseInt(row[4]),
      remaining_sessions: parseInt(row[5]),
      purchase_date: row[6],
      expiry_date: row[7],
      status: row[8],
      created_at: row[9]
    }));
  }

  async decrementCourseSession(courseId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Courses!A2:J',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === courseId);

    if (rowIndex !== -1) {
      const remainingSessions = parseInt(rows[rowIndex][5]) - 1;
      const status = remainingSessions <= 0 ? 'completed' : 'active';

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Courses!F${rowIndex + 2}:I${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[remainingSessions, rows[rowIndex][6], rows[rowIndex][7], status]]
        }
      });
    }
  }

  async updateCourse(courseId, updates) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Courses!A2:J',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === courseId);

    if (rowIndex === -1) {
      throw new Error('Course not found');
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      courseId,
      currentRow[1], // student_id
      currentRow[2], // course_type
      currentRow[3], // coach
      currentRow[4], // total_sessions
      updates.remaining_sessions !== undefined ? updates.remaining_sessions : currentRow[5],
      currentRow[6], // purchase_date
      currentRow[7], // expiry_date
      updates.status !== undefined ? updates.status : currentRow[8],
      currentRow[9]  // created_at
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Courses!A${rowIndex + 2}:J${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    });

    return {
      course_id: updatedRow[0],
      student_id: updatedRow[1],
      course_type: updatedRow[2],
      coach: updatedRow[3],
      total_sessions: parseInt(updatedRow[4]),
      remaining_sessions: parseInt(updatedRow[5]),
      purchase_date: updatedRow[6],
      expiry_date: updatedRow[7],
      status: updatedRow[8],
      created_at: updatedRow[9]
    };
  }

  // ========== Bookings ==========
  async createBookingWithCode(courseId, studentId, date, timeSlot, coach) {
    const bookingId = uuidv4();
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const status = 'pending';
    const createdAt = new Date().toISOString();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Bookings!A:L',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          bookingId,
          courseId,
          studentId,
          date,
          timeSlot,
          coach,
          status,
          verificationCode,
          '', // verified_at
          '', // verified_by
          createdAt,
          createdAt // updated_at
        ]]
      }
    });

    return {
      booking_id: bookingId,
      course_id: courseId,
      student_id: studentId,
      date: date,
      time_slot: timeSlot,
      coach: coach,
      status: status,
      verification_code: verificationCode,
      created_at: createdAt
    };
  }

  async createBooking(courseId, studentId, date, timeSlot, coach) {
    const bookingId = uuidv4();
    const createdAt = new Date().toISOString();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Bookings!A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[bookingId, courseId, studentId, date, timeSlot, coach, 'scheduled', createdAt, createdAt]]
      }
    });

    // 扣除課程堂數
    await this.decrementCourseSession(courseId);

    return { booking_id: bookingId };
  }

  async getBookingsByStudentId(studentId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Bookings!A2:I',
    });

    const rows = response.data.values || [];
    return rows
      .filter(row => row[2] === studentId)
      .map(row => ({
        booking_id: row[0],
        course_id: row[1],
        student_id: row[2],
        date: row[3],
        time_slot: row[4],
        coach: row[5],
        status: row[6],
        created_at: row[7],
        updated_at: row[8]
      }));
  }

  async getAllBookings() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Bookings!A2:I',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      booking_id: row[0],
      course_id: row[1],
      student_id: row[2],
      date: row[3],
      time_slot: row[4],
      coach: row[5],
      status: row[6],
      created_at: row[7],
      updated_at: row[8]
    }));
  }

  // ========== Coach Schedule ==========
  async createSchedule(coach, date, timeSlot) {
    const scheduleId = uuidv4();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'CoachSchedule!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[scheduleId, coach, date, timeSlot, 'true', '']]
      }
    });

    return { schedule_id: scheduleId };
  }

  async getAvailableSchedules(date, coach = null) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoachSchedule!A2:F',
    });

    const rows = response.data.values || [];
    return rows
      .filter(row =>
        row[2] === date &&
        row[4] === 'true' &&
        (!coach || row[1] === coach)
      )
      .map(row => ({
        schedule_id: row[0],
        coach: row[1],
        date: row[2],
        time_slot: row[3],
        is_available: row[4] === 'true',
        booking_id: row[5]
      }));
  }

  async getAllSchedules() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoachSchedule!A2:F',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      schedule_id: row[0],
      coach: row[1],
      date: row[2],
      time_slot: row[3],
      is_available: row[4] === 'true',
      booking_id: row[5]
    }));
  }

  async updateSchedule(scheduleId, updates) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoachSchedule!A2:F',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === scheduleId);

    if (rowIndex === -1) {
      throw new Error('Schedule not found');
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      scheduleId,
      currentRow[1], // coach
      currentRow[2], // date
      currentRow[3], // time_slot
      updates.is_available !== undefined ? updates.is_available.toString() : currentRow[4],
      updates.booking_id !== undefined ? updates.booking_id : currentRow[5]
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `CoachSchedule!A${rowIndex + 2}:F${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    });

    return {
      schedule_id: updatedRow[0],
      coach: updatedRow[1],
      date: updatedRow[2],
      time_slot: updatedRow[3],
      is_available: updatedRow[4] === 'true',
      booking_id: updatedRow[5]
    };
  }

  async markScheduleAsBooked(scheduleId, bookingId) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoachSchedule!A2:F',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === scheduleId);

    if (rowIndex !== -1) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `CoachSchedule!E${rowIndex + 2}:F${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['false', bookingId]]
        }
      });
    }
  }

  // ========== Course Packages ==========
  async createCoursePackage(packageName, courseType, coach, totalSessions, validityDays, price, description) {
    const packageId = uuidv4();
    const status = 'active';
    const createdAt = new Date().toISOString();

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'CoursePackages!A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          packageId,
          packageName,
          courseType,
          coach || '',
          totalSessions,
          validityDays || '',
          price,
          description || '',
          status,
          createdAt
        ]]
      }
    });

    return {
      package_id: packageId,
      package_name: packageName,
      course_type: courseType,
      coach: coach,
      total_sessions: totalSessions,
      validity_days: validityDays,
      price: price,
      description: description,
      status: status,
      created_at: createdAt
    };
  }

  async getAllCoursePackages() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoursePackages!A2:J',
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      package_id: row[0],
      package_name: row[1],
      course_type: row[2],
      coach: row[3],
      total_sessions: parseInt(row[4]) || 0,
      validity_days: row[5] ? parseInt(row[5]) : null,
      price: parseFloat(row[6]) || 0,
      description: row[7],
      status: row[8],
      created_at: row[9]
    }));
  }

  async getActiveCoursePackages() {
    const packages = await this.getAllCoursePackages();
    return packages.filter(pkg => pkg.status === 'active');
  }

  async updateCoursePackage(packageId, updates) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'CoursePackages!A2:J',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === packageId);

    if (rowIndex === -1) {
      throw new Error('Course package not found');
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [
      packageId,
      updates.package_name !== undefined ? updates.package_name : currentRow[1],
      updates.course_type !== undefined ? updates.course_type : currentRow[2],
      updates.coach !== undefined ? updates.coach : currentRow[3],
      updates.total_sessions !== undefined ? updates.total_sessions : currentRow[4],
      updates.validity_days !== undefined ? updates.validity_days : currentRow[5],
      updates.price !== undefined ? updates.price : currentRow[6],
      updates.description !== undefined ? updates.description : currentRow[7],
      updates.status !== undefined ? updates.status : currentRow[8],
      currentRow[9]
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `CoursePackages!A${rowIndex + 2}:J${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    });

    return {
      package_id: updatedRow[0],
      package_name: updatedRow[1],
      course_type: updatedRow[2],
      coach: updatedRow[3],
      total_sessions: parseInt(updatedRow[4]),
      validity_days: updatedRow[5] ? parseInt(updatedRow[5]) : null,
      price: parseFloat(updatedRow[6]),
      description: updatedRow[7],
      status: updatedRow[8],
      created_at: updatedRow[9]
    };
  }

  async deleteCoursePackage(packageId) {
    return this.updateCoursePackage(packageId, { status: 'inactive' });
  }
}

export default new GoogleSheetsService();
