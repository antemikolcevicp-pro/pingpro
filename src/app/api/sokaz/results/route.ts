import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // @ts-ignore
    const userTeam = session.user.sokazTeam;
    // @ts-ignore
    const userLigaContent = session.user.sokazLiga || ""; // e.g., "muška 1. liga"

    if (!userTeam) {
        return NextResponse.json({ error: "SOKAZ profile not linked or team missing" }, { status: 400 });
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
