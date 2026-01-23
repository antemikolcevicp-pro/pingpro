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

        // Fetch fresh user to get teamId
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        });

        if (!user?.teamId) {
            return NextResponse.json([]); // No team, no activities
        }

        const teamBookings = await prisma.booking.findMany({
            where: {
                startDateTime: { gte: new Date() }, // Upcoming
                status: { not: 'CANCELLED' },
                user: {
                    teamId: user.teamId,
                    id: { not: userId } // Exclude my own bookings (already shown in "My Bookings")
                }
            },
            include: {
                user: { select: { name: true, image: true } },
                coach: { select: { name: true } },
                location: { select: { name: true } }
            },
            orderBy: { startDateTime: 'asc' },
            take: 10
        });

        return NextResponse.json(teamBookings);
    } catch (error) {
        console.error("Team Activities Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
