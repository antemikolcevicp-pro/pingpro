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
        const date = new Date(dateStr);
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
            status: { not: 'CANCELLED' }
        };

        if (coachId) {
            where.coachId = coachId;
        } else if (locationId) {
            where.locationId = locationId;
            where.coachId = null; // Hall bookings specifically
        }

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
            orderBy: { startDateTime: 'asc' }
        });

        // 🟢 SANITIZE NAMES FOR PRIVACY
        const sanitizedActivities = activities.map(act => {
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
