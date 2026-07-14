// This function receives the alert TradingView sends and saves it.
// TradingView will POST here whenever your Pine Script fires a LONG or CASH signal.

import { getStore } from "@netlify/blobs";

export default async (req) => {
  // Only accept POST requests (TradingView always sends POST)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Parse the JSON body TradingView sends
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Check the secret matches, so random people on the internet can't fake signals.
  // The real value lives in Netlify's Environment Variables (set in the dashboard),
  // never written in this file.
  const SECRET = process.env.WEBHOOK_SECRET;
  if (!SECRET || body.secret !== SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Make sure the signal is one of the two states we expect
  const state = (body.state || "").toUpperCase();
  if (state !== "LONG" && state !== "CASH") {
    return new Response("Invalid state, must be LONG or CASH", { status: 400 });
  }

  const signal = {
    state,
    price: body.price ?? null,
    time: body.time || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };

  // "signals" is just a name for this bucket of stored data - Netlify Blobs
  // creates it automatically the first time you use it.
  const store = getStore("signals");

  // Save the latest signal (this is what the website will read)
  await store.setJSON("latest", signal);

  // Also keep a running history log (capped at the most recent 200 entries)
  const history = (await store.get("history", { type: "json" })) || [];
  history.push(signal);
  if (history.length > 200) history.shift();
  await store.setJSON("history", history);

  return new Response(JSON.stringify({ ok: true, stored: signal }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
