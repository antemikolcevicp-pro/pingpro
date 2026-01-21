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

        // Update User in our database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                sokazId: sokazId.toString(),
                sokazTeam: teamName,
                sokazStats: stats ? `${stats} (${liga || ''})` : null
            }
        });

        // Try to find a matching team in our system and join it automatically
        if (teamName) {
            const matchingTeam = await prisma.team.findFirst({
                where: { name: { contains: teamName, mode: 'insensitive' } }
            });

            if (matchingTeam) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { teamId: matchingTeam.id }
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
