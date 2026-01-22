import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const coachId = searchParams.get("coachId");
    const locationId = searchParams.get("locationId");

    if (!dateStr) return new NextResponse("Date required", { status: 400 });

    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        // @ts-ignore
        const currentUserId = session.user.id;
        // @ts-ignore
        const currentUserTeamId = session.user.teamId;
        // @ts-ignore
        const isAdmin = session.user.role === Role.ADMIN || session.user.role === Role.COACH;

        const where: any = {
            startDateTime: {
                gte: startOfDay(date),
                lte: endOfDay(date),
            },
            status: { not: 'CANCELLED' },
            OR: [
                { locationId: locationId || "bakarić" },
                { coachId: coachId }
            ]
        };

        const activities = await prisma.booking.findMany({
            where: where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        teamId: true
                    }
                }
            },
            orderBy: [
                { startDateTime: 'asc' },
                { userId: 'desc' }, // Hacky way to move current user, but better to sort in mem if needed
            ]
        });

        // Better: Sort in memory to strictly prioritize currentUserId
        const sortedActivities = activities.sort((a, b) => {
            if (a.userId === currentUserId && b.userId !== currentUserId) return -1;
            if (a.userId !== currentUserId && b.userId === currentUserId) return 1;
            return 0;
        });


        // 🟢 SANITIZE NAMES FOR PRIVACY
        const sanitizedActivities = sortedActivities.map(act => {
            // Admin sees everything
            if (isAdmin) return act;

            // User sees their own bookings
            if (act.userId === currentUserId) return act;

            // User sees names of team members
            if (currentUserTeamId && act.user?.teamId === currentUserTeamId) {
                return act;
            }

            // Otherwise, mask name
            return {
                ...act,
                notes: act.status === 'BLOCKED' ? "ZAUZETO" : "RESERVIRANO",
                user: {
                    ...act.user,
                    name: act.status === 'BLOCKED' ? "Dizajn/Blokirano" : "Rezervirano (Igrač)"
                }
            };
        });

        return NextResponse.json(sanitizedActivities);
    } catch (error) {
        console.error("Calendar Data Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
