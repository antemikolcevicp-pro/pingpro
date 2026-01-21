import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET - List all users with their teams
export async function GET() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                team: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const teams = await prisma.team.findMany({
            select: { id: true, name: true }
        });

        return NextResponse.json({ users, teams });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH - Update user role or team
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { userId, role, teamId } = await req.json();

        if (!userId) return new NextResponse("User ID required", { status: 400 });

        // Security check: only ADMIN can promote someone to ADMIN
        if (role === Role.ADMIN && userRole !== Role.ADMIN) {
            return new NextResponse("Only admins can grant ADMIN role", { status: 403 });
        }

        // Security check: Coaches cannot modify Admin accounts
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (targetUser?.role === Role.ADMIN && userRole === Role.COACH) {
            return new NextResponse("Coaches cannot modify Admin accounts", { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(role && { role }),
                teamId: teamId === "none" ? null : teamId
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE - Delete a user
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) return new NextResponse("User ID required", { status: 400 });

        // Preventive check: Don't delete yourself
        // @ts-ignore
        if (userId === session.user.id) {
            return new NextResponse("Cannot delete yourself", { status: 400 });
        }

        // Security check: Coaches cannot delete Admin accounts
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (targetUser?.role === Role.ADMIN && userRole === Role.COACH) {
            return new NextResponse("Coaches cannot delete Admin accounts", { status: 403 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
