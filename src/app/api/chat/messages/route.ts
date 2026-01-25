import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { text, conversationId } = await req.json();
        // @ts-ignore
        const userId = session.user.id;

        if (!text || !conversationId) return new NextResponse("Missing data", { status: 400 });

        const message = await prisma.message.create({
            data: {
                text,
                conversationId,
                senderId: userId
            },
            include: {
                sender: true
            }
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Trigger Pusher
        try {
            await pusherServer.trigger(conversationId, "new-message", message);
        } catch (err) {
            console.error("Pusher error:", err);
            // We don't fail the request if pusher fails, but it's not ideal
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
