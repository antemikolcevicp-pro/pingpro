import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function handler(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, phoneNumber } = body;
        const dataToUpdate: any = {};

        if (name && name.trim().length >= 2) {
            dataToUpdate.name = name.trim();
        }

        if (phoneNumber && phoneNumber.trim().length >= 5) {
            dataToUpdate.phoneNumber = phoneNumber.trim();
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return new NextResponse("No valid fields to update", { status: 400 });
        }

        // @ts-ignore
        const userId = session.user.id;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    return handler(req);
}

export async function PATCH(req: Request) {
    return handler(req);
}

export async function GET(req: Request) {
    return handler(req);
}
