import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 這個 API 用於同步 OAuth 用戶到後端系統
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { auth_provider, auth_id, email, name, profile_image } = body;

        // 呼叫原本的後端 API 檢查或建立學生
        const backendUrl = process.env.API_URL || 'http://localhost:3000';

        // 先查詢是否已經存在此用戶
        const studentsRes = await fetch(`${backendUrl}/api/students`);
        const students = await studentsRes.json();

        const existingStudent = students.find(
            (s: any) => s.auth_id === auth_id && s.auth_provider === auth_provider
        );

        if (existingStudent) {
            return NextResponse.json({ student_id: existingStudent.student_id });
        }

        // 建立新學生
        const newStudent = {
            line_user_id: auth_provider === 'line' ? auth_id : '',
            student_name: name || 'Unknown',
            contact_name: name || 'Unknown',
            contact_phone: '',
            notes: `Registered via ${auth_provider}`,
            auth_provider,
            auth_id,
            email: email || '',
            profile_image: profile_image || '',
        };

        const createRes = await fetch(`${backendUrl}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStudent),
        });

        const createdStudent = await createRes.json();
        return NextResponse.json({ student_id: createdStudent.student_id });

    } catch (error) {
        console.error('Error in auth sync:', error);
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        );
    }
}
