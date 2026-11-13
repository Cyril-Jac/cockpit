/* Cockpit – digitales Ich. Daten: Supabase (Region Zürich), Zugriff nur mit Login. */
"use strict";

const CFG = {
  url: "https://nnfrnhyitpbrbpjnmgfp.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZnJuaHlpdHBicmJwam5tZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1NDAxODMsImV4cCI6MjExMDExNjE4M30.z8W82Iud-IjFmLd-Eu-nQHA_sSNrvP7Ti0nDpeOWZe0",
  version: "1.0.0",
};
const TEST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has("test");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const speicher = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* voll oder gesperrt */ } },
};

// ---------------------------------------------------------------- Formate
const nf0 = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const chf = (x, d = 0) => (x == null || isNaN(x) ? "–" : (d ? nf2 : nf0).format(x));
const pct = (x, d = 0) => (x == null || !isFinite(x) ? "–" : (x * 100).toFixed(d).replace(".", ",") + " %");
const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const heute = () => d0(new Date());
const isoTag = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const plusTage = (n) => { const x = heute(); x.setDate(x.getDate() + n); return x; };
const hhmm = (d) => new Date(d).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
function datumKurz(d) { const x = new Date(d); return `${TAGE[x.getDay()]} ${x.getDate()}.${x.getMonth() + 1}.`; }
function fristText(frist, mitZeit) {
  if (!frist) return "";
  const f = new Date(frist), tage = Math.round((d0(f) - heute()) / 864e5);
  const zeit = mitZeit ? " " + hhmm(f) : "";
  if (tage < 0) return `überfällig seit ${-tage} T`;
  if (tage === 0) return "heute" + zeit;
  if (tage === 1) return "morgen" + zeit;
  if (tage < 7) return datumKurz(f) + zeit;
  return `${f.getDate()}.${f.getMonth() + 1}.${f.getFullYear() !== new Date().getFullYear() ? f.getFullYear() : ""}`;
}
function alter(ts) {
  if (!ts) return "nie";
  const min = Math.round((Date.now() - new Date(ts)) / 6e4);
  if (min < 2) return "gerade eben"; if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60); if (h < 36) return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} T`;
}
const quelleSchluessel = (q) => (q || "").replace(/\s*[(:·,|].*$/, "").replace(/\d{1,2}\.\d{1,2}\.(\d{2,4})?/g, "").replace(/^\s*\d+\.\s*/, "").trim();

// ---------------------------------------------------------------- Icons
const IC = {
  heute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/></svg>',
  geld: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19"/><path d="M6.5 15h3"/></svg>',
  depot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="m5 15 4-4 3 3 6-7"/><path d="M15 7h3v3"/></svg>',
  uni: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 9 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11.2V16c0 1.2 2.5 3 5.5 3s5.5-1.8 5.5-3v-4.8M21.5 9v5"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4M4 6h11l-2 3.5L15 13H4"/><path d="M18 20v-5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  neu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/></svg>',
  ok: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  weg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  uhr: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>',
};
const TABS = [
  ["heute", "Heute", "heute"], ["jobs", "Jobs", "jobs"], ["geld", "Geld", "finanzen"],
  ["depot", "Depot", "depot"], ["uni", "Uni", "uni"], ["plan", "5 Jahre", "langfrist"],
];

// ---------------------------------------------------------------- Zustand
const S = {
  tab: speicher.get("cockpit-tab", "heute"),
  d: speicher.get("cockpit-daten", null),
  geladen: speicher.get("cockpit-geladen", null),
  offline: false, mehr: false,
};
let sb = null;

// ---------------------------------------------------------------- Daten
const ABFRAGEN = () => {
  const h = isoTag(heute()), gestern = isoTag(plusTage(-1)), in60 = isoTag(plusTage(60)), vor400 = isoTag(plusTage(-400)), vor45 = isoTag(plusTage(-45));
  return {
    aufgaben: (q) => q.from("v_meine_aufgaben").select("*"),
    manager: (q) => q.from("v_manager_arbeit").select("*").order("geaendert", { ascending: false }).limit(25),
    entscheide: (q) => q.from("freigaben").select("*").eq("status", "offen").in("typ", ["Entscheid", "Bewerbung"]).order("frist", { ascending: true, nullsFirst: false }),
    termine: (q) => q.from("termine").select("*").gte("start", gestern).lte("start", in60).order("start"),
    einschaetzung: (q) => q.from("v_einschaetzung").select("*"),
    bewerbungen: (q) => q.from("bewerbungen").select("id,nr,stelle,firma,ort,status,kanal,fit,ats,eingereicht_am,frist,link,rollentyp,vorlage,geaendert").order("geaendert", { ascending: false }),
    erfolg: (q) => q.from("v_jobs_erfolg").select("*"),
    wochen: (q) => q.from("v_jobs_wochen").select("*"),
    finanzmonat: (q) => q.from("v_finanz_monat").select("*").gte("monat", vor400),
    ausgabenmonat: (q) => q.from("v_ausgaben_monat").select("*").gte("monat", vor400),
    saldo: (q) => q.from("v_saldo_aktuell").select("*"),
    prognose: (q) => q.from("prognose").select("datum,saldo").order("datum"),
    abos: (q) => q.from("abos").select("*").eq("aktiv", true).order("betrag", { ascending: false }),
    buchungen: (q) => q.from("buchungen").select("datum,betrag,text,kategorie,konto,intern").gte("datum", vor45).order("datum", { ascending: false }).limit(120),
    depot: (q) => q.from("v_depot_aktuell").select("*"),
    depotverlauf: (q) => q.from("depot_verlauf").select("*").order("datum"),
    trades: (q) => q.from("depot_trades").select("*").order("datum", { ascending: false }).limit(12),
    chancen: (q) => q.from("chancen").select("*").or(`gueltig_bis.is.null,gueltig_bis.gte.${h}`).order("relevanz", { ascending: false }).order("datum", { ascending: false }).limit(20),
    kurse: (q) => q.from("kurse").select("*").order("pruefung", { ascending: true, nullsFirst: false }),
    abgaben: (q) => q.from("uni_abgaben").select("*").order("frist"),
    ma: (q) => q.from("aufgaben").select("id,titel,frist,status").ilike("titel", "Frist: MA-Meilenstein%").order("frist"),
    meilensteine: (q) => q.from("meilensteine").select("*").order("datum", { ascending: true, nullsFirst: false }),
    ignorier: (q) => q.from("ignorierregeln").select("*").order("erstellt", { ascending: false }),
    sync: (q) => q.from("sync_status").select("*"),
    eingaben: (q) => q.from("eingaben").select("*").order("erstellt", { ascending: false }).limit(8),
  };
};

async function laden() {
  if (TEST) {
    const r = await fetch("test-daten.json?" + Date.now());
    S.d = await r.json(); S.geladen = new Date().toISOString(); render(); return;
  }
  const abfr = ABFRAGEN();
  const ergebnisse = await Promise.all(Object.entries(abfr).map(async ([k, f]) => {
    try { const { data, error } = await f(sb); if (error) throw error; return [k, data]; }
    catch (e) { console.warn(k, e); return [k, S.d?.[k] ?? []]; }
  }));
  const neu = Object.fromEntries(ergebnisse);
  if (!ergebnisse.some(([, v]) => v && v.length)) { S.offline = !navigator.onLine; }
  S.d = neu; S.geladen = new Date().toISOString(); S.offline = false;
  speicher.set("cockpit-daten", S.d); speicher.set("cockpit-geladen", S.geladen);
  render();
}

async function schreiben(fn, okText) {
  if (TEST) { if (okText) toast(okText); return { error: null }; }
  const r = await fn(sb);
  if (r.error) { toast("Nicht gespeichert: " + r.error.message); console.error(r.error); }
  else if (okText) toast(okText);
  return r;
}

// ---------------------------------------------------------------- Kleine UI-Bausteine
function toast(text, aktionen = [], ms = 4500) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(text)}</span>` + aktionen.map((a, i) => `<button data-i="${i}">${esc(a[0])}</button>`).join("");
  aktionen.forEach((a, i) => { $(`button[data-i="${i}"]`, t).onclick = () => { t.classList.remove("an"); a[1](); }; });
  t.classList.add("an");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("an"), ms);
}
function blatt(html, setup) {
  const b = $("#blatt"), s = $("#schleier");
  b.innerHTML = `<div class="griff"></div>${html}`;
  b.classList.add("an"); s.classList.add("an");
  s.onclick = blattZu;
  if (setup) setup(b);
}
function blattZu() { $("#blatt").classList.remove("an"); $("#schleier").classList.remove("an"); }
const tip = {
  zeig(x, y, html) { const t = $("#tip"); t.innerHTML = html; t.style.left = x + "px"; t.style.top = y + "px"; t.classList.add("an"); },
  weg() { $("#tip").classList.remove("an"); },
};
document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".chart")) tip.weg(); });

function einschaetzungKarte(dash) {
  const e = (S.d?.einschaetzung || []).find((x) => x.dashboard === dash);
  if (!e) return `<div class="karte ein"><div class="zeile"><span class="ampel gelb">·</span><div><div class="schlag">Noch keine Einschätzung</div><div class="stand">Der Manager schreibt sie beim nächsten Lauf.</div></div></div></div>`;
  const sym = { gruen: "✓", gelb: "!", rot: "!" }[e.ampel] || "";
  const punkte = (e.punkte || []).map((p) => `<li>${esc(p)}</li>`).join("");
  return `<div class="karte ein"><div class="zeile"><span class="ampel ${e.ampel}" aria-label="Ampel ${e.ampel}">${sym}</span>
    <div><div class="schlag">${esc(e.schlagzeile)}</div>${punkte ? `<ul>${punkte}</ul>` : ""}
    ${e.text ? `<details class="details"><summary>Mehr dazu</summary><div class="mehr">${esc(e.text)}</div></details>` : ""}
    <div class="stand">Einschätzung ${alter(e.stand)}${e.autor ? " · " + esc(e.autor) : ""}</div></div></div></div>`;
}
const kachel = (name, wert, sub = "", cls = "") => `<div class="kachel"><div class="name">${esc(name)}</div><div class="wert ${cls}">${wert}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;

// ---------------------------------------------------------------- Diagramme (SVG, Tooltip per Tippen)
function stufen(lo, hi, n = 4) {
  const roh = (hi - lo) / n || 1, p = Math.pow(10, Math.floor(Math.log10(Math.abs(roh)))), f = roh / p;
  const st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st, out = [];
  for (let v = a; v <= b + st / 2; v += st) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function nett(max) { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function balken(id, { labels, serien, hoehe = 190, fmt = (v) => chf(v) }) {
  const el = document.getElementById(id); if (!el) return;
  const W = Math.max(300, el.clientWidth || 340), H = hoehe, L = 44, R = 6, T = 8, B = 24;
  const ticks = stufen(0, Math.max(1, ...serien.flatMap((s) => s.werte.map((v) => v || 0))), 3), max = ticks[ticks.length - 1];
  const pw = W - L - R, ph = H - T - B, gw = pw / labels.length;
  const bw = Math.max(4, Math.min(18, (gw - 8) / serien.length - 2));
  const y = (v) => T + ph - (v / max) * ph;
  let s = "";
  ticks.forEach((v) => { const yy = y(v); s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="ax" x="${L - 6}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`; });
  labels.forEach((lab, i) => {
    const gx = L + gw * i + (gw - (bw + 2) * serien.length + 2) / 2;
    serien.forEach((se, j) => {
      const v = se.werte[i] || 0, x = gx + j * (bw + 2), yy = y(v), h = T + ph - yy, r = Math.min(4, h, bw / 2);
      const d = h <= 0 ? "" : `M${x},${T + ph} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${T + ph} Z`;
      s += `<path d="${d}" fill="${se.farbe}" data-tip="${esc(`${lab} · ${se.name}: ${fmt(v)}`)}"/>`;
      s += `<rect x="${x - 1}" y="${T}" width="${bw + 2}" height="${ph}" fill="transparent" data-tip="${esc(`${lab} · ${se.name}: ${fmt(v)}`)}"/>`;
    });
    if (labels.length <= 14 || i % 2 === 0) s += `<text class="ax" x="${L + gw * i + gw / 2}" y="${H - 6}" text-anchor="middle">${esc(lab)}</text>`;
  });
  s += `<line class="null" x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}"/>`;
  const leg = serien.length > 1 ? `<div class="legende">${serien.map((x) => `<span style="--c:${x.farbe}">${esc(x.name)}</span>`).join("")}</div>` : "";
  el.innerHTML = `${leg}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Balkendiagramm">${s}</svg>`;
  tipAn(el);
}
function linie(id, { punkte, hoehe = 180, fmt = (v) => chf(v), farbe = "var(--s1)", nullLinie = false, heuteMarke = false }) {
  const el = document.getElementById(id); if (!el || !punkte.length) { if (el) el.innerHTML = `<div class="leer">Noch keine Daten.</div>`; return; }
  const W = Math.max(300, el.clientWidth || 340), H = hoehe, L = 48, R = 8, T = 10, B = 24;
  const xs = punkte.map((p) => +new Date(p.x)), vs = punkte.map((p) => p.y);
  let lo = Math.min(...vs, nullLinie ? 0 : Infinity), hi = Math.max(...vs, nullLinie ? 0 : -Infinity);
  if (lo === hi) { lo -= 1; hi += 1; }
  const tk = stufen(lo, hi, 3); lo = tk[0]; hi = tk[tk.length - 1];
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = (t) => L + ((t - x0) / Math.max(1, x1 - x0)) * (W - L - R), Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let s = "";
  tk.forEach((v) => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; });
  if (nullLinie && lo < 0 && hi > 0) s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--crit)" stroke-width="1" stroke-dasharray="4 4"/>`;
  const pfad = punkte.map((p, i) => `${i ? "L" : "M"}${X(+new Date(p.x)).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
  s += `<path d="${pfad} L${X(x1)},${T + (H - T - B)} L${X(x0)},${T + (H - T - B)} Z" fill="${farbe}" opacity=".1"/>`;
  s += `<path d="${pfad}" fill="none" stroke="${farbe}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  const marken = [0, Math.floor(punkte.length / 2), punkte.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  marken.forEach((i) => { const d = new Date(punkte[i].x); s += `<text class="ax" x="${X(+d)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === punkte.length - 1 ? "end" : "middle"}">${d.getDate()}.${d.getMonth() + 1}.</text>`; });
  if (heuteMarke) { const t = +heute(); if (t >= x0 && t <= x1) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H - B}" stroke="var(--text-3)" stroke-dasharray="2 3"/>`; }
  s += `<line class="kreuz" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="var(--text-2)" stroke-width="1" opacity="0"/><circle class="kp" r="5" fill="${farbe}" stroke="var(--surface)" stroke-width="2" opacity="0"/>`;
  s += `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" class="flaeche"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf">${s}</svg>`;
  const svg = $("svg", el), fl = $(".flaeche", el), kr = $(".kreuz", el), kp = $(".kp", el);
  const zeige = (e) => {
    const r = svg.getBoundingClientRect(), sx = ((e.clientX - r.left) / r.width) * W;
    const t = x0 + ((sx - L) / (W - L - R)) * (x1 - x0);
    let best = 0; xs.forEach((v, i) => { if (Math.abs(v - t) < Math.abs(xs[best] - t)) best = i; });
    const px = X(xs[best]), py = Y(vs[best]);
    kr.setAttribute("x1", px); kr.setAttribute("x2", px); kr.setAttribute("opacity", ".5");
    kp.setAttribute("cx", px); kp.setAttribute("cy", py); kp.setAttribute("opacity", "1");
    const d = new Date(xs[best]);
    tip.zeig(r.left + (px / W) * r.width, r.top + (py / H) * r.height, `${datumKurz(d)} ${d.getFullYear()} · ${fmt(vs[best])}`);
  };
  fl.addEventListener("pointermove", zeige); fl.addEventListener("pointerdown", zeige);
  fl.addEventListener("pointerleave", () => { kr.setAttribute("opacity", "0"); kp.setAttribute("opacity", "0"); tip.weg(); });
}
function tipAn(el) {
  const f = (e) => { const t = e.target.closest("[data-tip]"); if (!t) { tip.weg(); return; } tip.zeig(e.clientX, e.clientY, esc(t.dataset.tip)); };
  el.addEventListener("pointermove", f); el.addEventListener("pointerdown", f); el.addEventListener("pointerleave", () => tip.weg());
}
function hbalken(items, fmt = (v) => chf(v), farbe = "var(--s1)") {
  const max = Math.max(1, ...items.map((i) => i.wert));
  return `<div class="hbar">${items.map((i) => `<div class="lab">${esc(i.name)}${i.zusatz ? ` <span class="muted klein">${i.zusatz}</span>` : ""}</div><div class="val">${fmt(i.wert)}</div>
    <div class="bar"><i style="width:${Math.max(1.5, (i.wert / max) * 100)}%;background:${i.farbe || farbe}"></i></div>`).join("")}</div>`;
}

// ---------------------------------------------------------------- Seiten
function seiteHeute() {
  const d = S.d || {};
  const auf = [...(d.aufgaben || [])].sort((a, b) => b.dringlich - a.dringlich || (a.frist ? +new Date(a.frist) : 9e15) - (b.frist ? +new Date(b.frist) : 9e15));
  const sicht = S.mehr ? auf : auf.slice(0, 7);
  const ents = (d.entscheide || []).filter((f) => !f.antwort);
  let h = einschaetzungKarte("heute");
  if (!window.matchMedia("(display-mode: standalone)").matches && !navigator.standalone && /iPhone|iPad/.test(navigator.userAgent))
    h += `<div class="banner">📲 <div>Als App installieren: unten auf <b>Teilen</b> tippen, dann <b>Zum Home-Bildschirm</b>.</div></div>`;
  if (ents.length) {
    h += `<div class="karte"><h2>Entscheide für dich · ${ents.length}</h2><ul class="liste">${ents.map((f) => `
      <li class="entscheid" data-id="${f.id}"><div class="frage">${esc(f.frage)}</div>
      <div class="meta">${f.frist ? `<span class="chip ${new Date(f.frist) < new Date() ? "rot" : "blau"}">${fristText(f.frist, true)}</span>` : ""}${f.typ === "Bewerbung" ? '<span class="chip">Bewerbung</span>' : ""}</div>
      ${f.kontext ? `<details class="details"><summary>Hintergrund</summary>${esc(f.kontext)}${f.link ? `<br><a href="${esc(f.link)}" target="_blank" rel="noopener">Öffnen</a>` : ""}</details>` : ""}
      <div class="antworten">${(f.erlaubt?.length ? f.erlaubt : ["Ja", "Nein", "Später"]).map((a) => `<button class="knopf ${a === "Ja" || a === "Einreichen" ? "primaer" : ""}" data-antwort="${esc(a)}">${esc(a)}</button>`).join("")}</div></li>`).join("")}</ul></div>`;
  }
  h += `<div class="karte"><h2>Deine Aufgaben · ${auf.length}</h2>`;
  if (!auf.length) h += `<div class="leer">Nichts offen. Neues kommt über das Plus unten rechts.</div>`;
  h += `<ul class="liste">${sicht.map(aufgabeZeile).join("")}</ul>`;
  if (auf.length > 7) h += `<button class="knopf mehrzeigen" id="mehr">${S.mehr ? "Weniger zeigen" : `Alle ${auf.length} zeigen`}</button>`;
  h += `</div>`;
  const kommend = (d.termine || []).filter((t) => new Date(t.ende || t.start) >= new Date());
  h += terminKarte(kommend.filter((t) => new Date(t.start) < plusTage(S.woche ? 8 : 3)), S.woche ? "Diese Woche" : "Nächste 3 Tage",
    `<button class="knopf mehrzeigen" id="woche">${S.woche ? "Nur 3 Tage" : "Ganze Woche zeigen"}</button>`);
  const mg = (d.manager || []).filter((m) => m.status !== "erledigt");
  const mf = (d.manager || []).filter((m) => m.status === "erledigt");
  h += `<div class="karte"><h2>Was der Manager macht</h2><details class="details"><summary>${mg.length} in Arbeit · ${mf.length} diese Woche erledigt</summary>
    <ul class="liste" style="margin-top:8px">${mg.slice(0, 12).map((m) => `<li><div class="titel" style="font-weight:500">${esc(m.titel)}</div><div class="meta">${m.frist ? fristText(m.frist) : ""}</div></li>`).join("")}
    ${mf.slice(0, 8).map((m) => `<li><div class="titel muted" style="font-weight:500">✓ ${esc(m.titel)}</div></li>`).join("")}</ul></details></div>`;
  const ein = d.eingaben || [];
  if (ein.length) h += `<div class="karte"><h2>Deine Nachrichten an den Manager</h2><ul class="liste">${ein.slice(0, 4).map((e) => `<li><div>${esc(e.text)}</div><div class="meta">${alter(e.erstellt)} · ${e.verarbeitet_am ? "✓ " + esc(e.ergebnis || "erledigt") : "wartet auf den nächsten Lauf"}</div></li>`).join("")}</ul></div>`;
  return h;
}
function aufgabeZeile(a) {
  const ueber = a.frist && new Date(a.frist) < new Date();
  const cl = (a.checkliste || []);
  const notiz = (a.notiz || "").trim();
  return `<li class="aufgabe" data-id="${a.id}">
    <div class="titel">${esc(a.titel)}</div>
    <div class="meta">${a.frist ? `<span class="chip ${ueber ? "rot" : a.dringlich >= 3 ? "gelb" : ""}">${fristText(a.frist, a.frist_mit_zeit)}</span>` : ""}${a.bereich ? `<span class="chip">${esc(a.bereich)}</span>` : ""}${a.minuten ? `<span class="chip">${a.minuten} Min.</span>` : ""}</div>
    ${notiz || cl.length ? `<details class="details"><summary>${cl.length ? `Checkliste ${cl.filter((c) => c.fertig).length}/${cl.length}` : "Nächster Schritt"}</summary>
      ${cl.map((c) => `<div class="check ${c.fertig ? "fertig" : ""}"><span class="b"></span><span>${esc(c.text)}</span></div>`).join("")}
      ${notiz ? `<div style="margin-top:6px">${esc(notiz)}</div>` : ""}</details>` : ""}
    <div class="knoepfe"><button class="knopf gut" data-akt="erledigt">${IC.ok}Erledigt</button><button class="knopf weg" data-akt="verworfen">${IC.weg}Nicht relevant</button><button class="knopf weg" data-akt="spaeter">${IC.uhr}Später</button></div></li>`;
}
function terminKarte(termine, titel, fuss = "") {
  if (!termine.length) return `<div class="karte"><h2>${titel}</h2><div class="leer">Keine Termine erfasst.</div>${fuss}</div>`;
  const tage = {};
  termine.forEach((t) => { const k = isoTag(t.start); (tage[k] ||= []).push(t); });
  return `<div class="karte"><h2>${titel}</h2>${Object.entries(tage).map(([k, ts]) => {
    const tg = new Date(k), diff = Math.round((d0(tg) - heute()) / 864e5);
    const name = diff === 0 ? "Heute" : diff === 1 ? "Morgen" : `${TAGE[tg.getDay()]} ${tg.getDate()}. ${MONATE[tg.getMonth()]}`;
    return `<div class="tag">${name}</div>${ts.map((t) => `<div class="termin"><div class="zeit">${t.ganztags ? "ganztags" : hhmm(t.start)}</div><div class="strich" style="background:${terminFarbe(t)}"></div><div class="was"><div class="titel" style="font-weight:500">${esc(t.titel)}</div>${t.ort ? `<div class="meta">${esc(t.ort)}</div>` : ""}</div></div>`).join("")}`;
  }).join("")}${fuss}</div>`;
}
function terminArt(t) {
  const s = `${t.titel} ${t.ort || ""}`;
  if (/interview|bewerb|assessment|recruit|julius|ubs|jb\b|lgt|pictet|helvetia/i.test(s)) return "job";
  if (/hsg|case|vorlesung|prüfung|pruefung|ma-|masterarbeit|canvas|kurs|seminar|lernen|amazonia/i.test(s)) return "uni";
  if (/^\[c\]/i.test(t.titel)) return "block";
  return "privat";
}
const terminFarbe = (t) => ({ job: "var(--s1)", uni: "var(--s3)", block: "var(--s7)", privat: "var(--s4)" }[terminArt(t)]);

function seiteJobs() {
  const b = S.d?.bewerbungen || [];
  const eingereicht = b.filter((x) => x.eingereicht_am || ["eingereicht", "interview", "angebot", "abgesagt"].includes(x.status));
  const antworten = eingereicht.filter((x) => ["interview", "angebot", "abgesagt"].includes(x.status));
  const interviews = b.filter((x) => ["interview", "angebot"].includes(x.status));
  const w7 = eingereicht.filter((x) => x.eingereicht_am && new Date(x.eingereicht_am) >= plusTage(-7)).length;
  const offen = b.filter((x) => x.status === "eingereicht");
  let h = einschaetzungKarte("jobs");
  h += `<div class="kacheln">${kachel("Eingereicht", eingereicht.length, `${w7} in 7 Tagen`)}${kachel("Interviews", interviews.length, pct(interviews.length / Math.max(1, eingereicht.length)) + " Quote")}
    ${kachel("Antworten", antworten.length, pct(antworten.length / Math.max(1, eingereicht.length)) + " Rücklauf")}${kachel("Warten", offen.length, "noch ohne Antwort")}</div>`;
  h += `<div class="karte"><h2>Bewerbungen pro Woche</h2><div class="chart" id="c-wochen"></div></div>`;
  const iv = b.filter((x) => x.status === "interview");
  const bereit = b.filter((x) => ["dossier_bereit", "freigegeben"].includes(x.status));
  const lauf = [...iv, ...bereit, ...offen.sort((a, z) => (z.eingereicht_am || "").localeCompare(a.eingereicht_am || ""))];
  h += `<div class="karte"><h2>Läuft gerade · ${lauf.length}</h2><ul class="liste">${lauf.slice(0, S.alleBew ? 99 : 8).map((x) => {
    const chipc = x.status === "interview" ? "gruen" : x.status === "eingereicht" ? "blau" : "gelb";
    const tage = x.eingereicht_am ? Math.round((heute() - d0(x.eingereicht_am)) / 864e5) : null;
    return `<li><div class="reihe"><div class="l"><div class="titel">${esc(x.stelle)}</div><div class="meta">${esc(x.firma || "")}${x.ort ? " · " + esc(x.ort) : ""}</div></div>
      <div class="r"><span class="chip ${chipc}">${esc(statusName(x.status))}</span>${tage != null ? `<div class="meta">${tage} T</div>` : ""}</div></div></li>`;
  }).join("") || '<li class="leer">Nichts in Arbeit.</li>'}</ul>${lauf.length > 8 ? `<button class="knopf mehrzeigen" id="alle-bew">${S.alleBew ? "Weniger" : `Alle ${lauf.length} zeigen`}</button>` : ""}</div>`;
  const erf = S.d?.erfolg || [];
  const tabelle = (dim) => {
    const rows = erf.filter((e) => e.dimension === dim).sort((a, z) => z.n - a.n);
    if (!rows.length) return "";
    return `<table class="tabelle"><tr><th>${dim}</th><th class="z">Gesendet</th><th class="z">Antwort</th><th class="z">Interview</th></tr>${rows.map((r) => `<tr><td>${esc(r.wert)}</td><td class="z">${r.n}</td><td class="z">${pct(r.antworten / Math.max(1, r.n))}</td><td class="z">${r.interviews ? `<b>${pct(r.interviews / Math.max(1, r.n))}</b>` : "0 %"}</td></tr>`).join("")}</table>`;
  };
  h += `<div class="karte"><h2>Wo es klappt</h2>${tabelle("Rollentyp")}<div style="height:14px"></div>${tabelle("Vorlage")}<div style="height:14px"></div>${tabelle("ATS")}
    <div class="klein muted" style="margin-top:8px">Vorlage nach Einreichedatum: v1 bis 8.11., v2 LGT-Muster ab 9.11., v3 Playbook ab 12.11.</div></div>`;
  h += terminKarte((S.d?.termine || []).filter((t) => terminArt(t) === "job" && new Date(t.ende || t.start) >= new Date()), "Job-Termine");
  const zu = b.filter((x) => ["abgesagt", "geschlossen"].includes(x.status)).slice(0, 10);
  h += `<div class="karte"><h2>Zuletzt abgeschlossen</h2><details class="details"><summary>${b.filter((x) => x.status === "abgesagt").length} Absagen, ${b.filter((x) => x.status === "geschlossen").length} geschlossen</summary>
    <ul class="liste" style="margin-top:8px">${zu.map((x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(x.stelle)}</div><div class="meta">${esc(x.firma || "")}</div></div><div class="r"><span class="chip">${esc(statusName(x.status))}</span></div></div></li>`).join("")}</ul></details></div>`;
  return h;
}
const statusName = (s) => ({ entdeckt: "entdeckt", dossier_bereit: "Dossier bereit", freigegeben: "freigegeben", eingereicht: "eingereicht", interview: "Interview", angebot: "Angebot", abgesagt: "Absage", geschlossen: "geschlossen" }[s] || s);
function chartsJobs() {
  const w = (S.d?.wochen || []).slice(-10);
  balken("c-wochen", { labels: w.map((x) => { const d = new Date(x.woche); return `${d.getDate()}.${d.getMonth() + 1}.`; }),
    serien: [{ name: "Eingereicht", farbe: "var(--s1)", werte: w.map((x) => x.eingereicht) }, { name: "Später Interview", farbe: "var(--s3)", werte: w.map((x) => x.interviews) }],
    fmt: (v) => nf0.format(v), hoehe: 170 });
}

function monateVoll(n) {
  // die letzten n abgeschlossenen Monate (ISO yyyy-mm-01)
  const out = [], d = new Date(); d.setDate(1);
  for (let i = n; i >= 1; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(isoTag(x)); }
  return out;
}
function seiteGeld() {
  const d = S.d || {};
  const fm = d.finanzmonat || [], am = d.ausgabenmonat || [];
  const voll = monateVoll(6);
  const fm6 = fm.filter((m) => voll.includes(m.monat));
  const schnittAus = fm6.reduce((s, m) => s + (+m.ausgaben || 0), 0) / Math.max(1, fm6.length);
  const schnittEin = fm6.reduce((s, m) => s + (+m.einnahmen || 0), 0) / Math.max(1, fm6.length);
  const quote = schnittEin ? (schnittEin - schnittAus) / schnittEin : null;
  const saldo = (d.saldo || []).find((s) => s.konto === "privatkonto");
  const prog = d.prognose || [];
  const tief = prog.length ? prog.reduce((a, b) => (+b.saldo < +a.saldo ? b : a)) : null;
  const negativ = prog.find((p) => +p.saldo < 0);
  let h = einschaetzungKarte("finanzen");
  h += `<div class="kacheln">${kachel("Konto", chf(saldo ? +saldo.saldo : null), saldo ? "Stand " + datumKurz(saldo.datum) : "")}
    ${kachel("Ausgaben Ø", chf(schnittAus), "pro Monat, letzte 6")}${kachel("Sparquote", pct(quote), "letzte 6 Monate", quote != null && quote < 0.1 ? "schlecht" : "")}
    ${kachel("Tiefstand", tief ? chf(+tief.saldo) : "–", tief ? (negativ ? `unter 0 ab ${datumKurz(negativ.datum)}` : "am " + datumKurz(tief.datum)) : "", tief && +tief.saldo < 0 ? "schlecht" : "")}</div>`;
  h += `<div class="karte"><h2>Einnahmen und Ausgaben pro Monat</h2><div class="chart" id="c-monate"></div></div>`;
  // Kategorien: Ø letzte 3 vs. Ø 3 davor
  const v3 = monateVoll(3), v6 = monateVoll(6).slice(0, 3);
  const kat = {};
  am.forEach((r) => { const k = r.kategorie; kat[k] ||= { a: 0, b: 0 }; if (v3.includes(r.monat)) kat[k].a += +r.ausgaben / 3; if (v6.includes(r.monat)) kat[k].b += +r.ausgaben / 3; });
  const katItems = Object.entries(kat).map(([name, x]) => ({ name, wert: x.a, delta: x.a - x.b })).filter((x) => x.wert > 5).sort((a, b) => b.wert - a.wert);
  h += `<div class="karte"><h2>Wohin das Geld geht · Ø pro Monat</h2><div class="klein muted" style="margin:-4px 0 10px">Letzte 3 Monate, in Klammern die Veränderung zu den 3 Monaten davor</div>
    ${hbalken(katItems.slice(0, 12).map((k) => ({ ...k, zusatz: Math.abs(k.delta) >= 10 ? `(${k.delta > 0 ? "+" : "−"}${chf(Math.abs(k.delta))})` : "" })))}</div>`;
  h += `<div class="karte"><h2>Kontostand · Prognose 90 Tage</h2><div class="chart" id="c-prognose"></div><div class="klein muted">Annahmen und Fixposten aus der Liquiditätsplanung; rote Linie = 0.</div></div>`;
  const abos = d.abos || [];
  h += `<div class="karte"><h2>Fixkosten und Abos</h2>${abos.length ? `<ul class="liste">${abos.map((a) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(a.name)}</div><div class="meta">${esc(a.rhythmus || "")}${a.vorschlag ? " · " + esc(a.vorschlag) : ""}</div></div><div class="r">${chf(+a.betrag, 2)}</div></div></li>`).join("")}</ul>` : '<div class="leer">Noch keine erkannt.</div>'}</div>`;
  const bu = (d.buchungen || []).filter((x) => !x.intern && +x.betrag < 0).slice(0, 15);
  h += `<div class="karte"><h2>Letzte Ausgaben</h2><ul class="liste">${bu.map((x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(x.text)}</div><div class="meta">${datumKurz(x.datum)} · ${esc(x.kategorie || "")}${x.konto === "kreditkarte" ? " · Karte" : ""}</div></div><div class="r">${chf(-x.betrag, 2)}</div></div></li>`).join("")}</ul></div>`;
  return h;
}
function chartsGeld() {
  const fm = (S.d?.finanzmonat || []).slice(-12);
  balken("c-monate", { labels: fm.map((m) => MONATE[new Date(m.monat).getMonth()]),
    serien: [{ name: "Einnahmen", farbe: "var(--s1)", werte: fm.map((m) => +m.einnahmen || 0) }, { name: "Ausgaben", farbe: "var(--s2)", werte: fm.map((m) => +m.ausgaben || 0) }] });
  linie("c-prognose", { punkte: (S.d?.prognose || []).map((p) => ({ x: p.datum, y: +p.saldo })), nullLinie: true, heuteMarke: true });
}

function seiteDepot() {
  const pos = S.d?.depot || [];
  const ohneCfd = pos.filter((p) => p.art !== "CFD");
  const wert = ohneCfd.reduce((s, p) => s + (+p.wert_chf || 0), 0);
  const gv = pos.reduce((s, p) => s + (+p.gv_chf || 0), 0);
  const kern = ohneCfd.filter((p) => p.topf === "kern").reduce((s, p) => s + (+p.wert_chf || 0), 0);
  const cfdEng = pos.filter((p) => p.art === "CFD").reduce((s, p) => s + Math.abs(+p.engagement_chf || 0), 0);
  const stand = pos[0]?.stand;
  let h = einschaetzungKarte("depot");
  h += `<div class="kacheln">${kachel("Depotwert", chf(wert), stand ? "Stand " + datumKurz(stand) : "")}${kachel("G/V offen", (gv >= 0 ? "+" : "−") + chf(Math.abs(gv)), "inkl. CFD", gv >= 0 ? "gut" : "schlecht")}
    ${kachel("Kern CL2", pct(kern / Math.max(1, wert)), chf(kern) + " CHF")}${kachel("CFD-Engagement", chf(cfdEng), "Hebel separat")}</div>`;
  const teile = ohneCfd.filter((p) => +p.wert_chf > 0).sort((a, b) => b.wert_chf - a.wert_chf);
  const farben = ["var(--s1)", "var(--s2)", "var(--s3)"];
  const gruppen = [["Kern (CL2)", teile.filter((p) => p.topf === "kern")], ["Trading-Topf", teile.filter((p) => p.topf !== "kern")]];
  h += `<div class="karte"><h2>Aufteilung</h2><div class="stapel">${gruppen.map(([n, ps], i) => { const v = ps.reduce((s, p) => s + +p.wert_chf, 0); return v ? `<i style="width:${(v / Math.max(1, wert)) * 100}%;background:${farben[i]}" title="${esc(n)}"></i>` : ""; }).join("")}</div>
    <div class="legende">${gruppen.map(([n, ps], i) => `<span style="--c:${farben[i]}">${esc(n)} ${pct(ps.reduce((s, p) => s + +p.wert_chf, 0) / Math.max(1, wert))}</span>`).join("")}</div></div>`;
  h += `<div class="karte"><h2>Positionen</h2><ul class="liste">${[...pos].sort((a, b) => (+b.wert_chf || 0) - (+a.wert_chf || 0)).map((p) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(p.name || p.symbol)}</div>
    <div class="meta">${p.art === "CFD" ? '<span class="chip gelb">CFD</span>' : `<span class="chip">${esc(p.topf === "kern" ? "Kern" : "Trading")}</span>`}${p.menge ? nf0.format(p.menge) + " Stk." : ""}</div></div>
    <div class="r">${p.art === "CFD" ? `<div>${chf(Math.abs(+p.engagement_chf))}</div><div class="meta">Engagement</div>` : `<div>${chf(+p.wert_chf)}</div>`}<div class="meta ${+p.gv_chf >= 0 ? "gut" : "schlecht"}">${+p.gv_chf >= 0 ? "+" : "−"}${chf(Math.abs(+p.gv_chf || 0))}${p.gv_pct != null ? " · " + pct(+p.gv_pct, 1) : ""}</div></div></div></li>`).join("") || '<li class="leer">Keine Depotdaten.</li>'}</ul></div>`;
  const ch = S.d?.chancen || [];
  const art = { termin: ["Termin", "blau"], signal: ["Signal", "gruen"], idee: ["Idee", ""], risiko: ["Risiko", "rot"] };
  h += `<div class="karte"><h2>Chancen-Radar</h2>${ch.length ? `<ul class="liste">${ch.map((c) => `<li><div class="titel">${esc(c.titel)}</div><div class="meta"><span class="chip ${art[c.art]?.[1] || ""}">${art[c.art]?.[0] || c.art}</span>${c.symbol ? `<span class="chip">${esc(c.symbol)}</span>` : ""}${c.gueltig_bis ? "bis " + datumKurz(c.gueltig_bis) : ""}</div>${c.text ? `<div class="details">${esc(c.text)}</div>` : ""}</li>`).join("")}</ul>` : '<div class="leer">Der Manager füllt das Radar beim nächsten Lauf.</div>'}</div>`;
  if ((S.d?.depotverlauf || []).length > 1) h += `<div class="karte"><h2>Depotwert</h2><div class="chart" id="c-depot"></div></div>`;
  const tr = S.d?.trades || [];
  h += `<div class="karte"><h2>Letzte Trades</h2><ul class="liste">${tr.map((t) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(t.richtung)} ${esc(t.name || t.symbol)}</div><div class="meta">${datumKurz(t.datum)} · ${t.menge ? nf0.format(t.menge) + " Stk." : ""}</div></div><div class="r">${chf(Math.abs(+t.betrag_chf || 0))}</div></div></li>`).join("")}</ul></div>`;
  return h;
}
function chartsDepot() { linie("c-depot", { punkte: (S.d?.depotverlauf || []).map((p) => ({ x: p.datum, y: +p.wert_chf })) }); }

function seiteUni() {
  const d = S.d || {};
  const kurse = d.kurse || [];
  const ects = kurse.filter((k) => k.ects != null);
  const bestanden = ects.filter((k) => k.status === "bestanden").reduce((s, k) => s + +k.ects, 0);
  const laufend = ects.filter((k) => ["laufend", "angemeldet"].includes(k.status)).reduce((s, k) => s + +k.ects, 0);
  const pruef = kurse.filter((k) => k.pruefung && new Date(k.pruefung) >= heute()).sort((a, b) => new Date(a.pruefung) - new Date(b.pruefung));
  const abg = (d.abgaben || []).filter((a) => a.status !== "abgegeben" && a.status !== "bestanden");
  const ma = d.ma || [];
  const naechsterMa = ma.find((m) => m.frist && new Date(m.frist) >= heute());
  let h = einschaetzungKarte("uni");
  h += `<div class="kacheln">${kachel("Credits", ects.length ? `${nf0.format(bestanden)}<span class="muted" style="font-size:15px"> / 90</span>` : "–", ects.length ? `${nf0.format(laufend)} laufend` : "ECTS werden ergänzt")}
    ${kachel("Nächste Prüfung", pruef[0] ? datumKurz(pruef[0].pruefung) : "–", pruef[0] ? esc(pruef[0].titel.slice(0, 28)) : "")}
    ${kachel("Abgaben offen", abg.length, abg[0]?.frist ? "nächste " + fristText(abg[0].frist) : "")}
    ${kachel("Masterarbeit", naechsterMa ? datumKurz(naechsterMa.frist) : "Jan. 27", naechsterMa ? "nächster Meilenstein" : "Abgabe")}</div>`;
  h += `<div class="karte"><h2>Abgaben und Prüfungen</h2><ul class="liste">${[
    ...abg.map((a) => ({ t: a.frist, titel: a.titel, sub: a.kurs, link: a.link, chip: "Abgabe", id: a.id })),
    ...pruef.map((k) => ({ t: k.pruefung, titel: "Prüfung " + k.titel, sub: k.pruefungsart || "", chip: "Prüfung" })),
  ].sort((a, b) => new Date(a.t || 8e15) - new Date(b.t || 8e15)).map((x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(x.titel)}</div><div class="meta">${esc(x.sub || "")}${x.link ? ` · <a href="${esc(x.link)}" target="_blank" rel="noopener">Canvas</a>` : ""}</div></div>
    <div class="r"><span class="chip ${x.t && new Date(x.t) < plusTage(7) ? "gelb" : "blau"}">${x.t ? fristText(x.t, true) : "offen"}</span><div class="meta">${x.chip}</div></div></div></li>`).join("") || '<li class="leer">Nichts offen.</li>'}</ul></div>`;
  h += `<div class="karte"><h2>Masterarbeit · Meilensteine</h2><ul class="liste">${ma.map((m) => { const t = m.titel.replace(/^Frist:\s*MA-Meilenstein:\s*/, "").replace(/\s*\((Mo|Di|Mi|Do|Fr|Sa|So) [^)]*\)\s*$/, "");
    return `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(t)}</div></div><div class="r"><span class="chip ${["erledigt"].includes(m.status) ? "gruen" : new Date(m.frist) < new Date() ? "rot" : "blau"}">${m.status === "erledigt" ? "erledigt" : fristText(m.frist)}</span></div></div></li>`; }).join("") || '<li class="leer">Keine Meilensteine erfasst.</li>'}
    <li><div class="reihe"><div class="l"><div class="titel">Abgabe Masterarbeit</div></div><div class="r"><span class="chip blau">Januar 2027</span></div></div></li></ul></div>`;
  h += `<div class="karte"><h2>Kurse</h2><ul class="liste">${kurse.map((k) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(k.titel)}</div><div class="meta">${esc(k.semester || "")}${k.notiz ? " · " + esc(k.notiz) : ""}</div></div><div class="r">${k.ects ? `<div>${k.ects} ECTS</div>` : ""}${k.pruefung ? `<div class="meta">${datumKurz(k.pruefung)}</div>` : ""}</div></div></li>`).join("")}</ul></div>`;
  h += terminKarte((d.termine || []).filter((t) => terminArt(t) === "uni" && new Date(t.ende || t.start) >= new Date()).slice(0, 20), "Uni-Termine");
  return h;
}

function seitePlan() {
  const ms = S.d?.meilensteine || [];
  const jetzt = ms.filter((m) => m.status === "geplant" && m.jetzt_tun).sort((a, b) => a.prioritaet - b.prioritaet || new Date(a.datum || 8e15) - new Date(b.datum || 8e15));
  const farbe = { Karriere: "var(--s1)", Finanzen: "var(--s2)", Vorsorge: "var(--s3)", Weiterbildung: "var(--s7)", Steuern: "var(--s4)", Wohnen: "var(--s5)", Versicherung: "var(--s6)", Studium: "var(--s3)" };
  let h = einschaetzungKarte("langfrist");
  h += `<div class="karte"><h2>Jetzt anstossen · ${jetzt.length}</h2><ul class="liste">${jetzt.slice(0, 8).map((m) => `<li data-ms="${m.id}"><div class="titel">${esc(m.titel)}</div><div class="meta"><span class="chip">${esc(m.bereich)}</span>${m.zeitraum ? esc(m.zeitraum) : m.datum ? datumKurz(m.datum) + " " + new Date(m.datum).getFullYear() : ""}</div>
    <div class="details">${esc(m.jetzt_tun)}</div>${m.warum ? `<details class="details"><summary>Warum</summary>${esc(m.warum)}</details>` : ""}
    <div class="knoepfe" style="display:flex;gap:8px;margin-top:8px"><button class="knopf gut" data-ms-akt="angestossen">${IC.ok}Angestossen</button><button class="knopf weg" data-ms-akt="verworfen">${IC.weg}Nicht relevant</button></div></li>`).join("") || '<li class="leer">Nichts dringend.</li>'}</ul></div>`;
  const jahre = {};
  ms.filter((m) => m.status !== "verworfen").forEach((m) => { const j = m.datum ? new Date(m.datum).getFullYear() : (m.zeitraum?.match(/20\d\d/)?.[0] || "offen"); (jahre[j] ||= []).push(m); });
  h += `<div class="karte"><h2>Zeitstrahl</h2><div class="zeitstrahl">${Object.keys(jahre).sort().map((j) => `<div class="jahr">${j}</div>${jahre[j].map((m) => `<div class="ms ${m.status === "erledigt" ? "erledigt" : ""}" style="--c:${farbe[m.bereich] || "var(--accent)"}"><div class="titel" style="font-weight:500">${esc(m.titel)}</div><div class="meta"><span class="chip">${esc(m.bereich)}</span>${m.zeitraum ? esc(m.zeitraum) : m.datum ? datumKurz(m.datum) : ""}${m.status !== "geplant" ? ` · ${esc(m.status)}` : ""}</div></div>`).join("")}`).join("") || '<div class="leer">Noch leer.</div>'}</div></div>`;
  return h;
}

// ---------------------------------------------------------------- Rahmen
function kopf(titel) {
  const sync = S.d?.sync || [];
  const alt = (q, std) => { const x = sync.find((s) => s.quelle === q); return !x ? "fehler" : !x.ok ? "fehler" : (Date.now() - new Date(x.zuletzt)) / 36e5 > std ? "alt" : ""; };
  const zustand = [alt("notion", 1), alt("finanzen", 30), alt("depot", 30)];
  const schlecht = zustand.includes("fehler") ? "fehler" : zustand.includes("alt") ? "alt" : "";
  return `<header class="kopf"><div><h1>${titel}</h1><div class="unter"><span class="punkt ${schlecht}"></span> ${S.offline ? "offline · " : ""}Stand ${S.geladen ? alter(S.geladen) : "–"}</div></div>
    <div class="rechts">${S.tab === "heute" ? `<button class="rund" id="b-filter" aria-label="Ausgeblendetes">${IC.filter}</button>` : ""}<button class="rund" id="b-neu" aria-label="Neu laden">${IC.neu}</button></div></header>`;
}
function render() {
  const app = $("#app");
  if (!S.d) { app.innerHTML = `<div class="login"><div class="box"><p>Lade …</p></div></div>`; return; }
  const [key, name] = TABS.find((t) => t[0] === S.tab) || TABS[0];
  const titel = { heute: `${TAGE[new Date().getDay()]} ${new Date().getDate()}. ${MONATE[new Date().getMonth()]}`, jobs: "Jobs", geld: "Geld", depot: "Depot", uni: "Uni", plan: "5 Jahre" }[key] || name;
  const seite = { heute: seiteHeute, jobs: seiteJobs, geld: seiteGeld, depot: seiteDepot, uni: seiteUni, plan: seitePlan }[key]();
  const y = window.scrollY;
  app.innerHTML = `${kopf(titel)}<main>${seite}</main>
    <button class="plus" id="b-plus" aria-label="Neu">${IC.plus}</button>
    <nav class="tabs">${TABS.map(([k, n]) => `<button class="${k === key ? "an" : ""}" data-tab="${k}">${IC[k]}<span>${n}</span></button>`).join("")}</nav>`;
  if (render.letzterTab === key) window.scrollTo(0, y); render.letzterTab = key;
  ({ jobs: chartsJobs, geld: chartsGeld, depot: chartsDepot }[key] || (() => {}))();
  binden();
}
function binden() {
  $$("nav.tabs button").forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; speicher.set("cockpit-tab", S.tab); S.mehr = false; window.scrollTo(0, 0); render(); });
  $("#b-neu").onclick = () => { toast("Lade neu …", [], 1200); laden(); };
  $("#b-plus").onclick = neuBlatt;
  const f = $("#b-filter"); if (f) f.onclick = ignorierBlatt;
  const m = $("#mehr"); if (m) m.onclick = () => { S.mehr = !S.mehr; render(); };
  const w = $("#woche"); if (w) w.onclick = () => { S.woche = !S.woche; render(); };
  const bl = $("#alle-bew"); if (bl) bl.onclick = () => { S.alleBew = !S.alleBew; render(); };
  $$(".aufgabe [data-akt]").forEach((b) => b.onclick = () => aufgabeAktion(b.closest(".aufgabe").dataset.id, b.dataset.akt));
  $$(".entscheid [data-antwort]").forEach((b) => b.onclick = () => entscheidAntwort(b.closest(".entscheid").dataset.id, b.dataset.antwort));
  $$("[data-ms-akt]").forEach((b) => b.onclick = () => meilenstein(b.closest("[data-ms]").dataset.ms, b.dataset.msAkt));
}

// ---------------------------------------------------------------- Aktionen
async function aufgabeAktion(id, akt) {
  const a = (S.d.aufgaben || []).find((x) => x.id === id); if (!a) return;
  if (akt === "spaeter") {
    const opt = [["Morgen", 1], ["In 3 Tagen", 3], ["Nächste Woche", 7], ["In 2 Wochen", 14], ["In einem Monat", 30]];
    blatt(`<h3>Später erinnern</h3><div class="klein muted" style="margin-bottom:10px">${esc(a.titel)}</div><div class="knoepfe" style="flex-direction:column">${opt.map(([n, t]) => `<button class="knopf" data-t="${t}">${n}<span class="muted" style="margin-left:auto">${datumKurz(plusTage(t))}</span></button>`).join("")}</div>`, (b) => {
      $$("[data-t]", b).forEach((k) => k.onclick = async () => {
        blattZu(); const bis = isoTag(plusTage(+k.dataset.t));
        S.d.aufgaben = S.d.aufgaben.filter((x) => x.id !== id); render();
        await schreiben((q) => q.from("aufgaben").update({ spaeter_bis: bis }).eq("id", id));
        toast(`Kommt am ${datumKurz(bis)} wieder.`, [["Rückgängig", async () => { await schreiben((q) => q.from("aufgaben").update({ spaeter_bis: null }).eq("id", id)); laden(); }]]);
      });
    });
    return;
  }
  const vorher = a.status;
  S.d.aufgaben = S.d.aufgaben.filter((x) => x.id !== id); render();
  const r = await schreiben((q) => q.from("aufgaben").update({ status: akt }).eq("id", id));
  if (r.error) { laden(); return; }
  const zurueck = ["Rückgängig", async () => { await schreiben((q) => q.from("aufgaben").update({ status: vorher }).eq("id", id)); laden(); }];
  const muster = quelleSchluessel(a.quelle);
  if (akt === "verworfen" && muster.length >= 4) {
    toast("Weg. Ähnliches künftig ausblenden?", [["Ja", async () => { await schreiben((q) => q.from("ignorierregeln").insert({ feld: "quelle", muster, grund: `Nicht relevant: ${a.titel.slice(0, 80)}` }), `«${muster}» wird ausgeblendet.`); laden(); }], zurueck], 7000);
  } else toast(akt === "erledigt" ? "Erledigt. Danke!" : "Ausgeblendet.", [zurueck]);
}
async function entscheidAntwort(id, antwort) {
  const f = (S.d.entscheide || []).find((x) => x.id === id); if (!f) return;
  f.antwort = antwort; render();
  const r = await schreiben((q) => q.from("freigaben").update({ antwort }).eq("id", id));
  if (r.error) { f.antwort = null; render(); return; }
  toast(`«${antwort}» gespeichert. Der Manager setzt es um.`, [["Rückgängig", async () => { await schreiben((q) => q.from("freigaben").update({ antwort: null }).eq("id", id)); laden(); }]]);
}
async function meilenstein(id, status) {
  S.d.meilensteine = (S.d.meilensteine || []).map((m) => m.id === id ? { ...m, status } : m); render();
  await schreiben((q) => q.from("meilensteine").update({ status }).eq("id", id), status === "angestossen" ? "Angestossen. Der Manager plant die Schritte." : "Ausgeblendet.");
}
function neuBlatt() {
  blatt(`<h3>Neu</h3><textarea id="neu-text" rows="4" placeholder="Aufgabe oder Nachricht an den Manager, z. B. «Swiss Life hat abgesagt» oder «Steinacher-Mails nie mehr als Aufgabe»"></textarea>
    <div style="margin-top:10px"><label class="klein muted">Frist (nur für Aufgaben, freiwillig)</label><input type="date" id="neu-frist"></div>
    <div class="knoepfe"><button class="knopf primaer" id="neu-auf">Als Aufgabe für mich</button><button class="knopf" id="neu-msg">An den Manager</button></div>
    <div class="hinweis">Nachrichten an den Manager verarbeitet er beim nächsten Lauf (mehrmals täglich): Korrekturen, Absagen, Wünsche.</div>`, (b) => {
    setTimeout(() => $("#neu-text", b).focus(), 250);
    $("#neu-auf", b).onclick = async () => {
      const t = $("#neu-text", b).value.trim(); if (!t) return;
      const frist = $("#neu-frist", b).value || null;
      blattZu();
      await schreiben((q) => q.from("aufgaben").insert({ titel: t.slice(0, 300), wer: "cyril", status: "offen", frist: frist ? frist + "T12:00:00+01:00" : null }), "Aufgabe angelegt.");
      laden();
    };
    $("#neu-msg", b).onclick = async () => {
      const t = $("#neu-text", b).value.trim(); if (!t) return;
      blattZu();
      await schreiben((q) => q.from("eingaben").insert({ text: t.slice(0, 2000), art: "notiz" }), "An den Manager geschickt.");
      laden();
    };
  });
}
function ignorierBlatt() {
  const r = S.d?.ignorier || [];
  blatt(`<h3>Ausgeblendet</h3><div class="klein muted" style="margin-bottom:6px">Immer ausgeblendet: Systemaufgaben, Vorbereitungsschritte (stehen als Checkliste in der Hauptaufgabe) und Termine (stehen im Kalender). Dazu deine Regeln:</div>
    ${r.map((x) => `<label class="schalter"><span><b>${esc(x.muster)}</b><br><span class="klein muted">${esc(x.grund || "")}${x.treffer ? ` · ${x.treffer}× gegriffen` : ""}</span></span><input type="checkbox" data-r="${x.id}" ${x.aktiv ? "checked" : ""}></label>`).join("") || '<div class="leer">Noch keine eigenen Regeln. Sie entstehen, wenn du bei «Nicht relevant» auf «Ja» tippst.</div>'}`, (b) => {
    $$("[data-r]", b).forEach((c) => c.onchange = async () => { await schreiben((q) => q.from("ignorierregeln").update({ aktiv: c.checked }).eq("id", c.dataset.r), c.checked ? "Regel aktiv." : "Regel aus."); laden(); });
  });
}

// ---------------------------------------------------------------- Login
function loginSeite(fehler = "") {
  $("#app").innerHTML = `<div class="login"><div class="box"><img class="logo" src="icons/icon-192.png" alt=""><h1>Cockpit</h1>
    <p>Der Code kommt als Push aufs Handy (ntfy).</p>
    <div id="schritt1"><button class="knopf primaer" id="b-code">Code aufs Handy schicken</button></div>
    <div id="schritt2" style="display:none"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······"><button class="knopf primaer" id="b-login">Anmelden</button></div>
    <div class="fehlertext" id="fehler">${esc(fehler)}</div><div class="hinweis">Privat. Du bleibst danach angemeldet.</div></div></div>`;
  const zeig2 = () => { $("#schritt1").style.display = "none"; $("#schritt2").style.display = "block"; setTimeout(() => $("#code").focus(), 100); };
  $("#b-code").onclick = async () => {
    $("#b-code").disabled = true; $("#fehler").textContent = "";
    try {
      const r = await fetch(`${CFG.url}/functions/v1/cockpit/login-code`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.key } });
      const j = await r.json();
      if (!j.ok) throw new Error(j.fehler || "Fehler");
      speicher.set("cockpit-email", j.email);
      zeig2();
    } catch (e) { $("#fehler").textContent = e.message; $("#b-code").disabled = false; }
  };
  const login = async () => {
    const code = $("#code").value.replace(/\D/g, "");
    if (code.length !== 6) { $("#fehler").textContent = "Bitte 6 Ziffern."; return; }
    $("#b-login").disabled = true;
    const email = speicher.get("cockpit-email");
    if (!email) { $("#fehler").textContent = "Bitte zuerst einen Code anfordern."; $("#b-login").disabled = false; return; }
    let { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) ({ error } = await sb.auth.verifyOtp({ email, token: code, type: "magiclink" }));
    if (error) { $("#fehler").textContent = "Code stimmt nicht oder ist abgelaufen."; $("#b-login").disabled = false; return; }
    start();
  };
  $("#b-login").onclick = login;
  $("#code").addEventListener("input", (e) => { if (e.target.value.replace(/\D/g, "").length === 6) login(); });
}

async function start() {
  render();
  await laden();
  clearInterval(start.t); start.t = setInterval(() => { if (document.visibilityState === "visible") laden(); }, 5 * 60e3);
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.geladen && Date.now() - new Date(S.geladen) > 60e3 && (TEST || sb)) laden(); });
window.addEventListener("online", () => { S.offline = false; laden(); });
window.addEventListener("offline", () => { S.offline = true; render(); });
let breite = window.innerWidth;
window.addEventListener("resize", () => { if (Math.abs(window.innerWidth - breite) > 40) { breite = window.innerWidth; render(); } });

(async function init() {
  if ("serviceWorker" in navigator && !TEST) navigator.serviceWorker.register("sw.js").catch(() => {});
  if (TEST) { start(); return; }
  sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "cockpit-auth", detectSessionInUrl: false } });
  const { data } = await sb.auth.getSession();
  if (data.session) start();
  else if (S.d && !navigator.onLine) { S.offline = true; render(); }
  else loginSeite();
  sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") loginSeite("Abgemeldet. Bitte neu anmelden."); });
})();
