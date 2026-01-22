import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO, addMinutes, format } from "date-fns";
import { sendBookingEmail, templates } from "@/lib/mail";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { startTime, coachId, duration, notes } = await req.json();
        const slotDuration = duration || 90;

        // @ts-ignore
        const userId = session.user.id;
        const startObj = parseISO(startTime);
        const endObj = addMinutes(startObj, slotDuration);

        // Robust overlap check
        const overlapping = await prisma.booking.findMany({
            where: {
                coachId,
                status: { not: 'CANCELLED' },
                startDateTime: { lt: endObj },
                endDateTime: { gt: startObj }
            }
        });

        if (overlapping.length > 0) {
            return new NextResponse("Termin se preklapa s postojećom rezervacijom.", { status: 400 });
        }

        // @ts-ignore
        const userRole = session.user.role;
        const initialStatus = (userRole === 'ADMIN' || userRole === 'COACH') ? 'CONFIRMED' : 'PENDING';

        const booking = await prisma.booking.create({
            data: {
                userId,
                coachId,
                startDateTime: startObj,
                endDateTime: endObj,
                status: initialStatus,
                notes
            },
            include: { coach: true, user: true }
        });

        // Email Notification to Coach
        if (initialStatus === 'PENDING' && booking.coach?.email) {
            const dateStr = format(startObj, "d.M.yyyy");
            const timeStr = format(startObj, "HH:mm");
            const payload = templates.newBookingRequest(booking.user.name || "Igrač", dateStr, timeStr);

            await sendBookingEmail(booking.coach.email, payload.subject, payload.html);
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error creating booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new NextResponse("ID required", { status: 400 });

    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!booking) return new NextResponse("Booking not found", { status: 404 });

        // @ts-ignore
        const isOwner = booking.userId === session.user.id;
        // @ts-ignore
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'COACH';

        if (!isOwner && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // 🛡️ 4-HOUR RULE FOR USERS
        if (!isAdmin) {
            const now = new Date();
            const start = new Date(booking.startDateTime);
            const diffMs = start.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 4) {
                return new NextResponse("Termin se može otkazati najkasnije 4 sata prije početka.", { status: 400 });
            }
        }

        // Actually delete or cancel? User said "ukloni rezervaciju", usually means delete for blocks or cancel for sessions
        // Let's go with delete for simplicity as requested "ukloni"
        await prisma.booking.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
