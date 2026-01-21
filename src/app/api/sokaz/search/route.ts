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
        // Use the official SOKAZ autocomplete endpoint
        const response = await fetch(`https://www.sokaz.hr/ajax_autocomplete.php?q=${encodeURIComponent(query)}&tip=ig`);
        const text = await response.text();

        // SOKAZ returns results in "Name|ID" format per line
        const lines = text.split('\n').filter(line => line.trim() && line.includes('|'));
        const results = lines.map(line => {
            const [name, id] = line.split('|');
            return {
                sokazId: id.trim(),
                name: name.trim()
            };
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("SOKAZ Search Error:", error);
        return new NextResponse("Error searching SOKAZ", { status: 500 });
    }
}
