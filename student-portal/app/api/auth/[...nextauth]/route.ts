import NextAuth from "next-auth";
import LineProvider from "next-auth/providers/line";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        LineProvider({
            clientId: process.env.LINE_CLIENT_ID!,
            clientSecret: process.env.LINE_CLIENT_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!account) return false;

            // 將用戶資訊同步到後端 API
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/api/auth/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth_provider: account.provider,
                        auth_id: account.providerAccountId,
                        email: user.email,
                        name: user.name,
                        profile_image: user.image,
                    }),
                });

                if (!response.ok) {
                    console.error('Failed to sync user to backend');
                    return true; // 仍然允許登入
                }

                const userData = await response.json();
                user.studentId = userData.student_id;

                return true;
            } catch (error) {
                console.error('Error syncing user:', error);
                return true;
            }
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.studentId = (user as any).studentId;
                token.provider = account?.provider;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).studentId = token.studentId;
                (session.user as any).provider = token.provider;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
