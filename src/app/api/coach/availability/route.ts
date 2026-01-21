import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session?.user || (session.user.role !== 'COACH' && session.user.role !== 'ADMIN')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const slots = await prisma.availabilitySlot.findMany({
            // @ts-ignore
            where: { coachId: session.user.id },
            orderBy: { dayOfWeek: 'asc' }
        });
        return NextResponse.json(slots);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session?.user || (session.user.role !== 'COACH' && session.user.role !== 'ADMIN')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { slots } = body; // Array of { dayOfWeek, startTime, endTime }

        // @ts-ignore
        const coachId = session.user.id;

        // Simple strategy: Replace all slots for this coach
        // In a real app, you might want more granular updates
        await prisma.$transaction([
            prisma.availabilitySlot.deleteMany({ where: { coachId } }),
            prisma.availabilitySlot.createMany({
                data: slots.map((s: any) => ({
                    coachId,
                    dayOfWeek: parseInt(s.dayOfWeek),
                    startTime: s.startTime,
                    endTime: s.endTime,
                })),
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
