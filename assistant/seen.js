/* ============================================================================
   FLR Hub: "last seen" for Hub settings (Hub migration 3.5).
   While a Hub app is open and on screen, this tells the FLR database every 4
   minutes that its signed-in person is here (public.hub_seen: their own last
   seen, at most once a minute, nothing else). Hub settings then shows "Active"
   for anyone seen in the last 10 minutes. Nothing is sent when nobody is signed
   in, the page is in the background, or the database doesn't have hub_seen yet.
   Loaded by assistant.js (every Hub app) and by the Order Tracker directly.
   ========================================================================== */
const AUTH_KEY = 'flr-estimator-auth';
const EVERY = 4 * 60 * 1000;
let last = 0, gone = false;

async function config() {
  if (window.FLR_CONFIG && window.FLR_CONFIG.supabaseUrl) return window.FLR_CONFIG;
  const text = await (await fetch(new URL('../flr-config.js', import.meta.url))).text();
  const pick = (k) => (new RegExp(k + ':\\s*"([^"]+)"').exec(text) || [])[1];
  return { supabaseUrl: pick('supabaseUrl'), supabaseAnonKey: pick('supabaseAnonKey') };
}
function token() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now()) ? s.access_token : null;
  } catch (e) { return null; }
}
async function ping() {
  if (gone || document.visibilityState !== 'visible' || Date.now() - last < EVERY - 5000) return;
  const t = token();
  if (!t) return;
  last = Date.now();
  try {
    const cfg = await config();
    const res = await fetch(cfg.supabaseUrl + '/rest/v1/rpc/hub_seen', {
      method: 'POST', headers: { apikey: cfg.supabaseAnonKey, authorization: 'Bearer ' + t, 'content-type': 'application/json' }, body: '{}' });
    if (res.status === 404) gone = true;   // before Hub migration 3.5: stop asking
  } catch (e) { /* offline: next time */ }
}
if (!window.__flrSeen) {
  window.__flrSeen = true;
  setTimeout(ping, 3000);
  setInterval(ping, 60 * 1000);
  document.addEventListener('visibilitychange', ping);
}
