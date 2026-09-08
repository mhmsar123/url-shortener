import { jsonOk, handleApiError } from "@/lib/api";
import { destroySession } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertCsrf(req);
    await destroySession();
    return jsonOk({ loggedOut: true });
  } catch (e) {
    return handleApiError(e);
  }
}
