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

        const conversations = await prisma.conversation.findMany({
            where: {
                users: { some: { id: userId } }
            },
            include: {
                users: true,
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
        const { participantId } = await req.json();
        // @ts-ignore
        const userId = session.user.id;

        if (!participantId) return new NextResponse("Missing participantId", { status: 400 });

        // Check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
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
