import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name } = await req.json();

        if (!name || name.trim().length < 2) {
            return new NextResponse("Invalid name", { status: 400 });
        }

        // @ts-ignore
        const userId = session.user.id;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name: name.trim() }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
