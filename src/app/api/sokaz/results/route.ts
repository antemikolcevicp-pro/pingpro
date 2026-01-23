import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // Check query params first, or fallback to fresh DB data
    const { searchParams } = new URL(req.url); // Not strictly needed if we fetch user fresh, but good for testing
    const teamParam = searchParams.get("teamName");

    // @ts-ignore
    const userId = session.user.id;

    // Fetch fresh user data to ensure we use the latest linked team
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sokazTeam: true, sokazLiga: true }
    });

    // Use direct SOKAZ team if linked, otherwise try param (from local team name)
    const userTeam = user?.sokazTeam || teamParam;
    const userLigaContent = user?.sokazLiga || "";
    // Note: If falling back to local team, we might lack "userLigaContent" so we default to "1. liga" logic later


    if (!userTeam) {
        return NextResponse.json([], { status: 200 }); // Return empty array instead of error if not linked
    }

    console.log(`[SOKAZ Results] Fetching for Team: ${userTeam}, Liga: ${userLigaContent}`);

    try {
        // 1. Detect League Number (lg) and Gender (spol)
        let lg = "1";
        const lgMatch = userLigaContent.match(/(\d+)\.\s*liga/i);
        if (lgMatch) lg = lgMatch[1];

        const spol = userLigaContent.toLowerCase().includes("ženska") ? "Z" : "M";

        // 2. Determine Season and Period (jesen/proljeće)
        // Hardcoded for now based on user's request, but could be dynamic
        const sezona = "2025";
        const doba = "jes";

        const url = `https://www.sokaz.hr/rez_lige.php?oblik=html&spol=${spol}&lg=${lg}&doba=${doba}&sezona=${sezona}&tip=kol`;

        const response = await fetch(url);
        const html = await response.text();

        // 3. Parse HTML to extract matches
        const rounds: any[] = [];
        const rows = html.split(/<tr[^>]*>/i);
        let currentRoundName = "Nepoznato kolo";

        rows.forEach(row => {
            // Check for round header
            const roundMatch = row.match(/<b>(\d+\.?[\s\u00A0]*KOLO)<\/b>/i);
            if (roundMatch) {
                currentRoundName = roundMatch[1].replace(/<[^>]*>/g, '').trim();
            }

            // A match row always contains 'zapisnik.php'
            if (row.toLowerCase().includes('zapisnik.php')) {
                const cells = row.split(/<\/td>/i).map(c => c.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());

                if (cells.length >= 5) {
                    const home = cells[1];
                    const away = cells[3];
                    const score = cells[4];

                    const linkMatch = row.match(/href="(zapisnik\.php\?[^"]+)"/i);
                    const link = linkMatch ? linkMatch[1] : "";

                    const teamLower = userTeam.toLowerCase();
                    if (home.toLowerCase() === teamLower || away.toLowerCase() === teamLower) {
                        rounds.push({
                            round: currentRoundName,
                            home,
                            away,
                            score: (score === ":" || !score) ? "Nije odigrano" : score,
                            reportUrl: `https://www.sokaz.hr/${link}`
                        });
                    }
                }
            }
        });

        console.log(`[SOKAZ API] Found ${rounds.length} matches for team ${userTeam}`);
        return NextResponse.json(rounds);
    } catch (error) {
        console.error("SOKAZ Results Error:", error);
        return new NextResponse("Error fetching SOKAZ results", { status: 500 });
    }
}
