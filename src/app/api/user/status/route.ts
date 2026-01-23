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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                teamId: true,
                team: {
                    // @ts-ignore
                    select: { name: true, league: true }
                },
                sokazId: true,
                sokazTeam: true,
                sokazStats: true,
                role: true
            }
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        // Logic check: If user is not in a team (teamId is null), we should clear the SOKAZ info
        // to prevent showing "stale" team connections.
        if (!user.teamId && (user.sokazId || user.sokazTeam)) {
            // Update in DB to make it permanent
            await prisma.user.update({
                where: { id: userId },
                data: {
                    sokazId: null,
                    sokazTeam: null,
                    sokazStats: null,
                    sokazLiga: null
                }
            });
            // Reflect in local object for immediate response
            user.sokazId = null;
            user.sokazTeam = null;
            user.sokazStats = null;
        }

        return NextResponse.json(user);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
