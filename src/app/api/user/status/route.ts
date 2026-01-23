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
                    select: { name: true, league: true }
                },
                sokazId: true,
                sokazTeam: true,
                sokazStats: true,
                role: true
            }
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        // Logic check: If user is not in a team (teamId is null), we should hide the SOKAZ team name 
        // to prevent showing "stale" team connections, unless they have a direct SOKAZ ID (personal link).
        // Even then, we might want to clear 'sokazTeam' so we don't fetch team results, only player results.
        if (!user.teamId) {
            user.sokazTeam = null;
        }

        return NextResponse.json(user);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
