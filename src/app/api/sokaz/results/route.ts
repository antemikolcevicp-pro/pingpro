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
        // Rounds are in <b>N. KOLO</b>
        // Match rows contain 'zapisnik.php' link
        const rounds: any[] = [];
        const lines = html.split('\n');
        let currentRound = "Nepoznato kolo";

        // This is a simplified parser - SOKAZ HTML is bit messy
        // We look for round headers and then match rows
        const matchRegex = /<tr>.*?<td[^>]*>(.*?)<\/td>.*?<td[^>]*>–<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<a href="(zapisnik\.php\?[^"]+)"/i;
        const roundRegex = /<b>(\d+)\.\s*KOLO<\/b>/i;

        lines.forEach(line => {
            const rdMatch = line.match(roundRegex);
            if (rdMatch) {
                currentRound = rdMatch[0].replace(/<[^>]*>/g, '').trim();
            }

            const mMatch = line.match(matchRegex);
            if (mMatch) {
                const home = mMatch[1].replace(/<[^>]*>/g, '').trim();
                const away = mMatch[2].replace(/<[^>]*>/g, '').trim();
                const score = mMatch[3].replace(/<[^>]*>/g, '').trim();
                const link = mMatch[4];

                // Filter for user's team
                if (home.includes(userTeam) || away.includes(userTeam)) {
                    rounds.push({
                        round: currentRound,
                        home,
                        away,
                        score: score === ":" ? "Nije odigrano" : score,
                        reportUrl: `https://www.sokaz.hr/${link}`
                    });
                }
            }
        });

        return NextResponse.json(rounds);
    } catch (error) {
        console.error("SOKAZ Results Error:", error);
        return new NextResponse("Error fetching SOKAZ results", { status: 500 });
    }
}
