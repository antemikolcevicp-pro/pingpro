import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHours } from "date-fns";
import { sendBookingEmail } from "@/lib/mail";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const now = new Date();
        const targetTimeStart = addHours(now, 0); // Check from now
        const targetTimeEnd = addHours(now, 1.5); // Up to 1.5 hours in the future (catching the 1h mark)

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
            if (booking.user?.email) {
                const dateStr = booking.startDateTime.toLocaleDateString('hr-HR');
                const timeStr = booking.startDateTime.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

                await sendBookingEmail(
                    booking.user.email,
                    `Sjetnik: Trening uskoro počinje! (${timeStr})`,
                    `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ff7e21;">Trening uskoro počinje! ⏰</h2>
                        <p>Bok <strong>${booking.user.name}</strong>,</p>
                        <p>Ovo je samo podsjetnik da imaš termin za stolni tenis danas.</p>
                        <p><strong>Vrijeme:</strong> ${timeStr}h</p>
                        <p><strong>Trener:</strong> ${booking.coach.name}</p>
                        <hr />
                        <p>Vidimo se u dvorani!</p>
                    </div>
                    `
                );
                console.log(`[Email Reminder] Sent to: ${booking.user.email}`);
            }

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
