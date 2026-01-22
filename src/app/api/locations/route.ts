import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const locations = await prisma.location.findMany({
            where: {
                isActive: true,
            },
        });

        return NextResponse.json(locations);
    } catch (error) {
        console.error("[LOCATIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
