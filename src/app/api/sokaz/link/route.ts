import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { sokazId } = await req.json();
        if (!sokazId) return new NextResponse("Missing SOKAZ ID", { status: 400 });

        // Fetch detailed info from SOKAZ profile
        const response = await fetch(`https://www.sokaz.hr/bazaig.php?id=${sokazId}&tip=prva`);
        const html = await response.text();

        // Extract Team and Stats using regex (simple but effective for their structure)
        const teamMatch = html.match(/Ekipa u kojoj igra:<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/i);
        const statsMatch = html.match(/Skor:<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/i);
        const ligaMatch = html.match(/Liga:<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/i);

        const teamName = teamMatch ? teamMatch[1].trim() : null;
        const stats = statsMatch ? statsMatch[1].trim() : null;
        const liga = ligaMatch ? ligaMatch[1].trim() : null;

        // @ts-ignore
        const userId = session.user.id;

        // Update User in our database with SOKAZ info
        await prisma.user.update({
            where: { id: userId },
            data: {
                sokazId: sokazId.toString(),
                sokazTeam: teamName,
                sokazStats: stats ? `${stats} (${liga || '-'})` : null,
                sokazLiga: liga
            }
        });

        // 🟢 AUTO TEAM MANAGEMENT
        if (teamName) {
            // Check if team exists
            let team = await prisma.team.findFirst({
                where: { name: { equals: teamName, mode: 'insensitive' } }
            });

            if (team) {
                // Team exists -> Join if not in a team, and update League info
                await prisma.user.update({
                    where: { id: userId },
                    data: { teamId: team.id }
                });

                // Update team league if we have fresh info and it's missing or changed
                if (liga && team.league !== liga) {
                    await prisma.team.update({
                        where: { id: team.id },
                        data: { league: liga }
                    });
                }
            } else {
                // Team does NOT exist -> Create it!
                // We make the current user the "coach/owner" of this auto-created team
                team = await prisma.team.create({
                    data: {
                        name: teamName,
                        // @ts-ignore
                        coachId: userId, // The user who linked it becomes the owner/coach
                        league: liga
                    }
                });

                // Add user to the new team
                await prisma.user.update({
                    where: { id: userId },
                    data: { teamId: team.id }
                });
            }
        }

        return NextResponse.json({
            success: true,
            team: teamName,
            stats: stats,
            joinedLocalTeam: !!teamName
        });
    } catch (error) {
        console.error("SOKAZ Linking Error:", error);
        return new NextResponse("Error linking SOKAZ profile", { status: 500 });
    }
}
