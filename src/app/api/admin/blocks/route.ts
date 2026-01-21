import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay } from "date-fns";
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

    try {
        const where: any = {};
        if (dateStr) {
            const date = new Date(dateStr);
            where.startDateTime = {
                gte: startOfDay(date),
                lte: endOfDay(date),
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
            orderBy: { startDateTime: 'asc' }
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
        const { startTime, endTime, notes } = await req.json();

        // @ts-ignore
        const userId = session.user.id;

        const block = await prisma.booking.create({
            data: {
                userId,
                coachId: userId,
                startDateTime: parseISO(startTime),
                endDateTime: parseISO(endTime),
                status: 'BLOCKED',
                notes: notes || "Dvorana zauzeta"
            }
        });

        return NextResponse.json(block);
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
