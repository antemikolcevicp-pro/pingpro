import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parse, format, addMinutes, startOfDay, endOfDay, isBefore, areIntervalsOverlapping } from "date-fns";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const durationStr = searchParams.get("duration");

    if (!dateStr) return new NextResponse("Date is required", { status: 400 });

    try {
        const date = new Date(dateStr);
        const duration = durationStr ? parseInt(durationStr) : 90;

        // 1. Get ALL non-cancelled activities
        const existingActivities = await prisma.booking.findMany({
            where: {
                startDateTime: {
                    gte: startOfDay(date),
                    lte: endOfDay(date),
                },
                status: { not: 'CANCELLED' }
            }
        });

        const START_TIME = "07:00";
        const END_TIME = "23:59";
        const STEP_MINUTES = 30;

        const isSokaz = searchParams.get("sokaz") === 'true';
        const sokazStartHour = 18;

        const blockStart = parse(START_TIME, "HH:mm", date);
        const blockEnd = parse(END_TIME, "HH:mm", date);

        const availableSlots: any[] = [];
        let current = new Date(blockStart);

        const defaultCoach = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'COACH'] } }
        });

        if (!defaultCoach) return NextResponse.json([]);

        while (current < blockEnd) {
            // SOKAZ Rule: Only check slots after 18:00
            if (isSokaz) {
                if (current.getHours() < sokazStartHour) {
                    current = addMinutes(current, STEP_MINUTES);
                    continue;
                }
            }

            // Calculate duration: if SOKAZ, duration is until end of day (blockEnd)
            // Otherwise use requested duration
            let currentDuration = duration;
            if (isSokaz) {
                // Difference in minutes between blockEnd and current
                currentDuration = (blockEnd.getTime() - current.getTime()) / 60000;
                if (currentDuration <= 0) break;
            }

            const slotStart = new Date(current);
            const slotEnd = addMinutes(slotStart, currentDuration);

            // Bounds check
            if (isBefore(blockEnd, slotEnd)) {
                if (!isSokaz) { // For regular, if it doesn't fit, break or skip
                    current = addMinutes(current, STEP_MINUTES);
                    continue;
                }
                // For SOKAZ, slotEnd IS blockEnd, so it fits by definition
            }

            const isOverlapping = existingActivities.some(activity => {
                return areIntervalsOverlapping(
                    { start: slotStart, end: slotEnd },
                    { start: new Date(activity.startDateTime), end: new Date(activity.endDateTime) }
                );
            });

            if (!isOverlapping) {
                availableSlots.push({
                    time: format(slotStart, "HH:mm"),
                    duration: currentDuration,
                    coachName: defaultCoach.name,
                    coachId: defaultCoach.id,
                });
            }

            current = addMinutes(current, STEP_MINUTES);
        }

        availableSlots.sort((a, b) => a.time.localeCompare(b.time));
        return NextResponse.json(availableSlots);
    } catch (error) {
        console.error("Error fetching available slots:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
