import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    try {
        // SOKAZ uses Windows-1250 encoding often, but let's try standard fetch first
        // They have a search form that redirects. 
        // A more reliable way is to use their alphabetical list or specific ID search.
        // For searching by name, we can try to scrape the list.

        const response = await fetch(`https://www.sokaz.hr/bazaig_form.php?tip=ime&ig=${encodeURIComponent(query)}`);
        const html = await response.text();

        // Regex to find player links: <a href="bazaig.php?id=4196&tip=prva" class="crni">Mikolčević, Ante</a>
        const playerRegex = /<a href="bazaig\.php\?id=(\d+)&tip=prva" class="crni">([^<]+)<\/a>/g;
        const results = [];
        let match;

        while ((match = playerRegex.exec(html)) !== null) {
            results.push({
                sokazId: match[1],
                name: match[2].trim()
            });
            if (results.length >= 10) break; // Limit results
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("SOKAZ Search Error:", error);
        return new NextResponse("Error searching SOKAZ", { status: 500 });
    }
}
