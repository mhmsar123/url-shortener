import { jsonOk } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return jsonOk({ loggedOut: true });
}
