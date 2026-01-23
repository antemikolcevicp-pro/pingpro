import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET - Get team details (members)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        sokazTeam: true
                    }
                }
            }
        });

        if (!team) return new NextResponse("Team not found", { status: 404 });

        return NextResponse.json(team);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE - Remove member from team
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // Not strictly used in logic below but required for signature matching
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url); // Use query param for userId
        const userId = searchParams.get("userId");

        if (!userId) return new NextResponse("User ID required", { status: 400 });

        // Verify user is actually in this team? Not strictly necessary if we just set teamId to null
        await prisma.user.update({
            where: { id: userId },
            data: {
                teamId: null,
                sokazId: null,
                sokazTeam: null,
                sokazStats: null,
                sokazLiga: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
