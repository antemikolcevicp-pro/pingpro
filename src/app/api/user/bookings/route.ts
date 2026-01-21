import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // @ts-ignore
        const userId = session.user.id;
        // @ts-ignore
        const role = session.user.role;

        let bookings;
        if (role === 'COACH' || role === 'ADMIN') {
            // Find all bookings coached by this user
            bookings = await prisma.booking.findMany({
                where: { coachId: userId },
                include: { user: true },
                orderBy: { startDateTime: 'asc' }
            });
        } else {
            // Find all bookings for this player
            bookings = await prisma.booking.findMany({
                where: { userId },
                include: { coach: true },
                orderBy: { startDateTime: 'asc' }
            });
        }

        return NextResponse.json(bookings);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
