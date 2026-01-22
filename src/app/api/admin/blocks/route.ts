import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay, addMinutes, addDays } from "date-fns";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    try {
        const where: any = {};
        if (dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            where.startDateTime = {
                gte: startOfDay(date),
                lte: endOfDay(date),
            };
        } else if (startDateStr && endDateStr) {
            where.startDateTime = {
                gte: new Date(startDateStr),
                lte: new Date(endDateStr),
            };
        } else {
            // By default, just show BLOCKED ones if no date provided
            where.status = 'BLOCKED';
        }

        const activities = await prisma.booking.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: [
                { startDateTime: 'asc' },
                { id: 'asc' }
            ]
        });
        return NextResponse.json(activities);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { startTime, endTime, notes, isAllDay, recurrence } = await req.json();

        // @ts-ignore
        const userId = session.user.id;
        const start = parseISO(startTime);
        let end = endTime ? parseISO(endTime) : addMinutes(start, 90);

        if (isAllDay) {
            start.setHours(7, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
        }

        // 🛡️ OVERLAP CHECK FOR ADMIN
        const overlapping = await prisma.booking.findMany({
            where: {
                status: { not: 'CANCELLED' },
                startDateTime: { lt: end },
                endDateTime: { gt: start },
                locationId: "bakarić" // Admins usually block the main hall
            }
        });

        if (overlapping.length > 0) {
            return new NextResponse("Novi termin se preklapa s postojećim rezervacijama.", { status: 400 });
        }

        const createBlock = async (s: Date, e: Date) => {
            return prisma.booking.create({
                data: {
                    userId,
                    coachId: userId,
                    startDateTime: s,
                    endDateTime: e,
                    status: 'BLOCKED',
                    notes: notes || "Dvorana zauzeta"
                }
            });
        };

        const blocks = [];
        const initialBlock = await createBlock(start, end);
        blocks.push(initialBlock);

        if (recurrence === 'WEEKLY') {
            for (let i = 1; i <= 4; i++) {
                const s = addDays(start, i * 7);
                const e = addDays(end, i * 7);
                blocks.push(await createBlock(s, e));
            }
        }

        return NextResponse.json(blocks);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return new NextResponse("ID Required", { status: 400 });

        await prisma.booking.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
