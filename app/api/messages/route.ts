// Redirect: messaging now uses /api/conversations
export async function GET() {
  return Response.redirect(new URL("/api/conversations", "http://localhost").pathname, 308);
}
