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
        const { startTime, coachId, duration, notes, participantCount, tableCount, locationId, isSokaz, targetUserId } = await req.json();
        const slotDuration = duration || 90;

        // @ts-ignore
        const currentUserId = session.user.id;
        // @ts-ignore
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'COACH';

        // Use targetUserId if provided by admin, otherwise use current user
        const userId = (isAdmin && targetUserId) ? targetUserId : currentUserId;

        const startObj = parseISO(startTime);

        let endObj;
        if (isSokaz) {
            endObj = new Date(startObj);
            endObj.setHours(23, 59, 59, 999);
        } else {
            endObj = addMinutes(startObj, slotDuration);
        }

        // 🛡️ PAST BOOKING PREVENTION
        if (!isAdmin) {
            const now = new Date();
            const leadTime = addMinutes(now, 15);
            if (startObj < leadTime) {
                return new NextResponse("Nije moguće rezervirati termin u prošlosti ili koji počinje za manje od 15 minuta.", { status: 400 });
            }
        }

        // Overlap check logic
        const overlapQuery: any = {
            status: { not: 'CANCELLED' },
            startDateTime: { lt: endObj },
            endDateTime: { gt: startObj },
        };

        if (isSokaz) {
            overlapQuery.locationId = locationId || "bakarić";
        } else {
            overlapQuery.OR = [
                { coachId: coachId },
                {
                    locationId: locationId || "bakarić",
                    OR: [
                        { status: 'BLOCKED' },
                        { notes: { startsWith: 'SOKAZ' } }
                    ]
                }
            ];
        }

        const overlapping = await prisma.booking.findFirst({
            where: overlapQuery,
            include: { user: true, coach: true }
        });

        if (overlapping) {
            const collisionTime = `${format(overlapping.startDateTime, "HH:mm")} - ${format(overlapping.endDateTime, "HH:mm")}`;
            const collisionNote = overlapping.notes || (overlapping.status === 'BLOCKED' ? "Blokada dvorane" : "Bilo koji termin");
            return new NextResponse(`Preklapanje s terminom: ${collisionTime} (${collisionNote})`, { status: 400 });
        }

        // @ts-ignore
        const userRole = session.user.role;
        let initialStatus: any = (userRole === 'ADMIN' || userRole === 'COACH') ? 'CONFIRMED' : 'PENDING';

        const booking = await prisma.booking.create({
            data: {
                userId,
                coachId: coachId || null,
                locationId: locationId || "bakarić",
                startDateTime: startObj,
                endDateTime: endObj,
                status: initialStatus,
                notes: isSokaz ? `SOKAZ: ${notes || ""}` : notes,
                participantCount: participantCount ? parseInt(participantCount) : 1,
                tableCount: tableCount ? parseInt(tableCount) : 1,
            },
            include: { coach: true, user: true, location: true }
        });

        // Email Notification to Coach for regular bookings
        if (initialStatus === 'PENDING' && booking.coach?.email) {
            const dateStr = format(startObj, "d.M.yyyy");
            const timeStr = format(startObj, "HH:mm");
            const payload = templates.newBookingRequest(booking.user?.name || "Igrač", dateStr, timeStr);

            await sendBookingEmail(booking.coach.email, payload.subject, payload.html);
        }

        // Email Notification for Solo Training (no coach) - notify admin for approval
        if (initialStatus === 'PENDING' && !booking.coach) {
            const dateStr = format(startObj, "d.M.yyyy");
            const timeStr = format(startObj, "HH:mm");
            const endTimeStr = format(endObj, "HH:mm");

            // Get first admin/coach to notify
            const admin = await prisma.user.findFirst({
                where: { role: { in: ['ADMIN', 'COACH'] } },
                select: { email: true, name: true }
            });

            if (admin?.email) {
                const adminPayload = {
                    subject: "Nova rezervacija samostalnog treninga - Odobrenje potrebno",
                    html: `
                        <h2>Nova rezervacija samostalnog treninga</h2>
                        <p><strong>Korisnik:</strong> ${booking.user?.name || 'Nepoznato'}</p>
                        <p><strong>Datum:</strong> ${dateStr}</p>
                        <p><strong>Vrijeme:</strong> ${timeStr} - ${endTimeStr}</p>
                        <p><strong>Broj osoba:</strong> ${booking.participantCount}</p>
                        <p>Molimo te da odobriš ili odbiješ ovu rezervaciju u admin panelu.</p>
                        <p><a href="https://pingpro-eight.vercel.app/admin/availability">Otvori kalendar</a></p>
                    `
                };
                await sendBookingEmail(admin.email, adminPayload.subject, adminPayload.html);
            }
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

        await prisma.booking.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
