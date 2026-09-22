import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown; intent?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const intent = typeof body.intent === "string" ? body.intent : "link";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ ok: false, error: "Add a valid email." }, { status: 400 });
  }

  console.info(`[scroll-detect] ${intent} signup: ${email}`);

  return NextResponse.json({ ok: true, intent }, { status: 200 });
}