import { NextResponse } from "next/server";

export async function GET() {
  const apkUrl =
    process.env.ANDROID_APK_URL ??
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ??
    null;

  if (!apkUrl) {
    return new NextResponse("APK Android nao configurado.", { status: 404 });
  }

  return NextResponse.redirect(apkUrl);
}
