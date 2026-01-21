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
        // Remove newlines and extra spaces to make regex reliable
        const cleanHtml = html.replace(/\s+/g, ' ');

        const rounds: any[] = [];

        // Find all round blocks. Rounds are separated by <b>N. KOLO</b>
        // Then we look for matches within that context.
        // A better way: match all <b>\d+. KOLO</b> or all <tr> with zapisnik.php

        const roundSplit = cleanHtml.split(/<b>(\d+\.\s*KOLO)<\/b>/i);
        // roundSplit[0] is garbage before 1st round
        // roundSplit[1] is "1. KOLO", roundSplit[2] is content...

        for (let i = 1; i < roundSplit.length; i += 2) {
            const roundName = roundSplit[i];
            const roundContent = roundSplit[i + 1];

            // Match all matches in this round: <tr>...<td>Home</td><td>–</td><td>Away</td><td>Score</td>...zapisnik.php...</tr>
            // The structure is roughly: <td>Home</td><td>–</td><td>Away</td><td>Score</td>
            const matchRegex = /<td[^>]*>.*?<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>–<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>.*?<a href="(zapisnik\.php\?[^"]+)"/gi;

            let m;
            while ((m = matchRegex.exec(roundContent)) !== null) {
                const home = m[1].replace(/<[^>]*>/g, '').trim();
                const away = m[2].replace(/<[^>]*>/g, '').trim();
                const score = m[3].replace(/<[^>]*>/g, '').trim();
                const link = m[4];

                if (home.includes(userTeam) || away.includes(userTeam)) {
                    rounds.push({
                        round: roundName,
                        home,
                        away,
                        score: (score === ":" || !score) ? "Nije odigrano" : score,
                        reportUrl: `https://www.sokaz.hr/${link}`
                    });
                }
            }
        }

        console.log(`[SOKAZ API] Found ${rounds.length} matches for team ${userTeam}`);
        return NextResponse.json(rounds);
    } catch (error) {
        console.error("SOKAZ Results Error:", error);
        return new NextResponse("Error fetching SOKAZ results", { status: 500 });
    }
}
