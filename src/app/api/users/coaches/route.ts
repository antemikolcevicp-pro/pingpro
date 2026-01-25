import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const coaches = await prisma.user.findMany({
            where: {
                role: Role.COACH
            },
            select: {
                id: true,
                name: true,
                image: true
            }
        });

        return NextResponse.json(coaches);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
