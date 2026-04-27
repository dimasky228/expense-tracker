import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { locale } = (await request.json()) as { locale?: string };
  if (!locale || !["en", "ru"].includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
