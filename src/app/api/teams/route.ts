import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // 1. Check if user is in a team
        // @ts-ignore
        const user = await prisma.user.findUnique({
            /* @ts-ignore */
            where: { id: session.user.id },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                bookings: {
                                    where: { startDateTime: { gte: new Date() }, status: 'CONFIRMED' },
                                    orderBy: { startDateTime: 'asc' },
                                    take: 5
                                }
                            }
                        },
                        coach: true
                    }
                }
            }
        });

        return NextResponse.json(user?.team || null);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { action, name, inviteCode } = await req.json();
        // @ts-ignore
        const userId = session.user.id;
        // @ts-ignore
        const role = session.user.role;

        if (action === 'CREATE') {
            const team = await prisma.team.create({
                data: {
                    name,
                    coachId: userId,
                    members: { connect: { id: userId } }
                }
            });
            // Automatically make creator a coach if they create a team? 
            // User requested: "Coach (me) – manages availability"
            // Let's at least update their role if they are the coach.
            if (role !== 'ADMIN') {
                await prisma.user.update({
                    where: { id: userId },
                    data: { role: 'COACH', teamId: team.id }
                });
            } else {
                await prisma.user.update({
                    where: { id: userId },
                    data: { teamId: team.id }
                });
            }
            return NextResponse.json(team);
        }

        if (action === 'JOIN') {
            const team = await prisma.team.findUnique({ where: { inviteCode } });
            if (!team) return new NextResponse("Invalid invite code", { status: 404 });

            await prisma.user.update({
                where: { id: userId },
                data: { teamId: team.id }
            });
            return NextResponse.json(team);
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
