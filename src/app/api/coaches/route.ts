import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const coaches = await prisma.user.findMany({
      where: {
        role: {
          in: ["COACH", "ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(coaches);
  } catch (error) {
    console.error("[COACHES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
