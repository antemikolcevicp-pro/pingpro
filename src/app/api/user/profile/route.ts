import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { phoneNumber } = await req.json();

        if (!phoneNumber) {
            return new NextResponse("Phone number is required", { status: 400 });
        }

        // @ts-ignore
        const userId = session.user.id;

        await prisma.user.update({
            where: { id: userId },
            data: { phoneNumber },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile update error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
