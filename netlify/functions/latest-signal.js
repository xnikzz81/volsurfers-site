// This function just reads back whatever webhook.js last saved.
// Your website's JavaScript will call this to show the live LONG/CASH state.

import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("signals");
  const latest = await store.get("latest", { type: "json" });

  if (!latest) {
    // Nothing has come in from TradingView yet
    return new Response(
      JSON.stringify({ state: null, message: "No signal received yet" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify(latest), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store", // always fetch fresh, never a stale cached copy
    },
  });
};
