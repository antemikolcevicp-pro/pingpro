import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHours } from "date-fns";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const now = new Date();
        const targetTimeStart = addHours(now, 23);
        const targetTimeEnd = addHours(now, 25);

        const upcomingBookings = await prisma.booking.findMany({
            where: {
                startDateTime: {
                    gte: targetTimeStart,
                    lte: targetTimeEnd
                },
                status: 'CONFIRMED',
                reminderSent: false
            },
            include: {
                user: true,
                coach: true
            }
        });

        for (const booking of upcomingBookings) {
            console.log(`[WhatsApp Reminder] To: ${booking.user.phoneNumber}, Msg: "Pozdrav ${booking.user.name}, podsjetnik za sutrašnji trening u ${booking.startDateTime.toLocaleTimeString('hr-HR')} s trenerom ${booking.coach.name}."`);

            await prisma.booking.update({
                where: { id: booking.id },
                data: { reminderSent: true }
            });
        }

        return NextResponse.json({ sent: upcomingBookings.length });
    } catch (error) {
        console.error("Cron Error:", error);
        return new NextResponse("Error", { status: 500 });
    }
}
