import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            studentId?: string;
            provider?: string;
        } & DefaultSession["user"];
    }

    interface User {
        studentId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        studentId?: string;
        provider?: string;
    }
}
