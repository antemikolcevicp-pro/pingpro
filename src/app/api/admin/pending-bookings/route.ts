import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pendingBookings = await prisma.booking.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { name: true, email: true } },
                coach: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json(pendingBookings);
    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
