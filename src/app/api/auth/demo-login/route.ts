import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Test mode is disabled. Please log in using your authorized employee credentials." },
    { status: 404 }
  );
}
