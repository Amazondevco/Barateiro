import { buscaGlobal } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const res = await buscaGlobal(q, 5);
  return Response.json(res);
}
