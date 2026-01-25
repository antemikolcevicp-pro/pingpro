import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== 'ADMIN' && userRole !== 'COACH')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-01"

    try {
        let dateRange = {};
        if (month) {
            const date = new Date(month + "-01");
            dateRange = {
                gte: startOfMonth(date),
                lte: endOfMonth(date),
            };
        }

        const bookings = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                startDateTime: dateRange
            },
            include: {
                user: {
                    select: {
                        name: true,
                        team: { select: { name: true } }
                    }
                },
                coach: { select: { name: true } }
            },
            orderBy: { startDateTime: 'desc' }
        });

        // Transform data to include duration and basic grouping
        const report = bookings.map(b => {
            const dur = differenceInMinutes(new Date(b.endDateTime), new Date(b.startDateTime));
            return {
                id: b.id,
                date: b.startDateTime,
                playerName: b.user?.name || "Nepoznati igrač",
                teamName: b.user?.team?.name || "Individualno",
                coachId: b.coachId,
                coachName: b.coach?.name || "Samo dvorana",
                durationMinutes: dur,
                hours: (dur / 60).toFixed(1)
            };
        });

        const totalMinutes = report.reduce((acc, curr) => acc + curr.durationMinutes, 0);

        return NextResponse.json({
            totalHours: (totalMinutes / 60).toFixed(1),
            totalSessions: report.length,
            details: report
        });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
