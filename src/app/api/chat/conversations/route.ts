import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // @ts-ignore
        const userId = session.user.id;
        // @ts-ignore
        const userTeamId = session.user.teamId;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { users: { some: { id: userId } } },
                    { teamId: userTeamId || 'NONE' }
                ]
            },
            include: {
                users: true,
                team: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { participantId, teamId } = await req.json();
        // @ts-ignore
        const userId = session.user.id;

        if (!participantId && !teamId) return new NextResponse("Missing participantId or teamId", { status: 400 });

        if (teamId) {
            // Team chat
            let conversation = await prisma.conversation.findFirst({
                where: { teamId }
            });

            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: { teamId }
                });
            }
            return NextResponse.json(conversation);
        }

        // Direct chat
        const existing = await prisma.conversation.findFirst({
            where: {
                teamId: null,
                AND: [
                    { users: { some: { id: userId } } },
                    { users: { some: { id: participantId } } }
                ]
            }
        });

        if (existing) return NextResponse.json(existing);

        const conversation = await prisma.conversation.create({
            data: {
                users: {
                    connect: [
                        { id: userId },
                        { id: participantId }
                    ]
                }
            }
        });

        return NextResponse.json(conversation);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
