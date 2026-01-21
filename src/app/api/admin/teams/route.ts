import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET - List all teams with their member counts
export async function GET() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const teams = await prisma.team.findMany({
            include: {
                _count: {
                    select: { members: true }
                },
                coach: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(teams);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST - Create a new team (Admin/Coach)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name } = await req.json();
        if (!name) return new NextResponse("Team name required", { status: 400 });

        const team = await prisma.team.create({
            data: {
                name,
                // @ts-ignore
                coachId: session.user.id
            }
        });

        return NextResponse.json(team);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE - Remove a team
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userRole = session?.user?.role;
    if (!session?.user || (userRole !== Role.ADMIN && userRole !== Role.COACH)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return new NextResponse("Team ID required", { status: 400 });

        // Security check: Coaches can't delete teams if there's an Admin? 
        // Actually, let's just let them manage.

        await prisma.team.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
