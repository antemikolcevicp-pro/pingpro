import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { sendBookingEmail, templates } from "@/lib/mail";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { bookingId, action, coachId } = await req.json();

        let status: any;
        if (action === 'CONFIRM') status = 'CONFIRMED';
        else if (action === 'CANCEL') status = 'CANCELLED';
        else if (action === 'COMPLETE') status = 'COMPLETED';
        else return new NextResponse("Invalid action", { status: 400 });

        const updateData: any = { status };
        if (action === 'CONFIRM' && coachId !== undefined) {
            updateData.coachId = coachId;
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: updateData,
            include: { user: true, coach: true }
        });

        // Email Notification to Player if confirmed
        if (status === 'CONFIRMED' && updated.user?.email) {
            const startDate = new Date(updated.startDateTime);
            const dateStr = startDate.toLocaleDateString("hr-HR", { timeZone: "Europe/Zagreb" });
            const timeStr = startDate.toLocaleTimeString("hr-HR", { timeZone: "Europe/Zagreb", hour: "2-digit", minute: "2-digit" });
            const coachName = updated.coach?.name || undefined;
            const payload = templates.bookingConfirmed(dateStr, timeStr, coachName);

            await sendBookingEmail(updated.user.email, payload.subject, payload.html);
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error confirming booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pending = await prisma.booking.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { startDateTime: 'asc' }
        });
        return NextResponse.json(pending);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
