/* Cockpit – digitales Ich. Daten: Supabase (Region Zürich), Zugriff nur mit Login. */
"use strict";

const CFG = {
  url: "https://nnfrnhyitpbrbpjnmgfp.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZnJuaHlpdHBicmJwam5tZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1NDAxODMsImV4cCI6MjExMDExNjE4M30.z8W82Iud-IjFmLd-Eu-nQHA_sSNrvP7Ti0nDpeOWZe0",
  version: "1.3.1",
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
  buch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></svg>',
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
    bewerbungen: (q) => q.from("bewerbungen").select("id,nr,stelle,firma,ort,status,kanal,fit,ats,eingereicht_am,frist,link,rollentyp,vorlage,geaendert,antwort_am,test_am,interview_am,angebot_am,absage_am").order("geaendert", { ascending: false }),
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
    instrumente: (q) => q.from("depot_instrumente").select("symbol,hebel"),
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
    const r = await fetch((new URLSearchParams(location.search).get("test") === "echt" ? "test-daten-echt.json" : "test-daten.json") + "?" + Date.now());
    S.d = await r.json(); S.geladen = new Date().toISOString(); render(); return;
  }
  const abfr = ABFRAGEN();
  const ergebnisse = await Promise.all(Object.entries(abfr).map(async ([k, f]) => {
    try { const { data, error } = await f(sb); if (error) throw error; return [k, data]; }
    catch (e) { console.warn(k, e); return [k, S.d?.[k] ?? []]; }
  }));
  const neu = Object.fromEntries(ergebnisse);
  const etwas = ergebnisse.some(([, v]) => v && v.length);
  S.offline = !etwas && !navigator.onLine;
  S.d = neu; if (etwas) S.geladen = new Date().toISOString();
  $("#b-sync")?.classList.remove("puls");
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

// ---------------------------------------------------------------- Texte säubern (Agenten-Prüfung 13.11.2026)
const MINUS = "−";
const vz = (x, d = 0) => (x == null || isNaN(x) ? "–" : (x >= 0 ? "+" : MINUS) + (d ? nf2 : nf0).format(Math.abs(x)));
const terminTitel = (s) => String(s || "").replace(/^\s*\[(c|claude)\]\s*/i, "").replace(/\s*\(\d+\s*Min\.?\)\s*$/i, "").trim();
const istBlock = (t) => /^\s*\[(c|claude)\]/i.test(t.titel || "");
function stelleTeile(s) {
  const m = String(s || "").match(/\s*\(((?:r-|req\.?|ref\.?|job ?id|stellen-?id)[^)]*)\)?\s*$/i);
  return m ? [String(s).slice(0, m.index).trim(), m[1].replace(/\)$/, "")] : [String(s || ""), ""];
}
function haendler(t) {
  let s = String(t || "")
    .replace(/^\*?\s*(online\s+)?(einkauf|zahlung|lastschrift|lsv|gutschrift)\s+/i, "")
    .replace(/^(twint|lsv)\s+/i, "").replace(/^\d+[.,]\d+\s+/, "")
    .replace(/\*+\d+\*?/g, "").replace(/,\s*[^,]*\s(CH|[A-Z]{2}\sCH)$/i, "").replace(/-\d{3,5}\b/g, "").replace(/\s\d{3,5}$/g, "")
    .replace(/\s{2,}/g, " ").trim();
  if (s && s === s.toUpperCase() && /[A-ZÄÖÜ]{3}/.test(s)) s = s.toLowerCase().replace(/(^|[\s\-/&(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(Ag|Gmbh|Sa|Bv)\b/g, (x) => x.toUpperCase());
  return s.slice(0, 48) || String(t || "");
}
const ohneCode = (s) => String(s || "").replace(/^(jour fixe\s+\d{1,2}\.\d{1,2}\.?\s*|plan\s+v\d+\s*)?[A-Z]\d+:\s*/i, "").replace(/\s*\(?\bK\d+[–-]K\d+\)?/g, "").trim();
function appLink(url) {
  const u = String(url || ""); const m = u.match(/(?:notion\.(?:so|com)\/)(?:.*?)([0-9a-f]{32})(?:[?#].*)?$/i);
  return m ? `#s/${m[1].toLowerCase()}` : u;
}
const linkAttr = (u) => { const l = appLink(u); return l.startsWith("#") ? `href="${esc(l)}"` : `href="${esc(l)}" target="_blank" rel="noopener"`; };
const tageBis = (d) => Math.round((d0(d) - heute()) / 864e5);
const tageSeit = (d) => Math.round((heute() - d0(d)) / 864e5);
function bisText(ts) {
  const ms = new Date(ts) - new Date(), min = Math.round(ms / 6e4);
  if (min < 0) return "läuft"; if (min < 60) return `in ${min} Min.`;
  const h = Math.round(min / 60); if (h < 20) return `in ${h} Std.`;
  const t = tageBis(ts); return t === 1 ? "morgen" : `in ${t} T`;
}
function mono(name) {
  const s = String(name || "?").trim(); let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  const k = s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return `<span class="mono" style="--h:${h}">${esc(k)}</span>`;
}

// Offene Abschnitte bleiben beim Neuzeichnen offen
S.offen = new Set(speicher.get("cockpit-offen", []));
const offen = (k) => (S.offen.has(k) ? " open" : "");
document.addEventListener("toggle", (e) => {
  const k = e.target?.dataset?.k; if (!k) return;
  if (e.target.open) { S.offen.add(k); S.offen.delete(k + "-zu"); } else { S.offen.delete(k); S.offen.add(k + "-zu"); }
  speicher.set("cockpit-offen", [...S.offen].slice(-80));
}, true);

// Datenstand je Quelle (nicht Laufzeit): Saldo, Buchungen, Saxo
function datenStand() {
  const d = S.d || {};
  const saldo = (d.saldo || []).find((s) => s.konto === "privatkonto");
  const buch = (d.buchungen || []).reduce((m, b) => (b.datum > m ? b.datum : m), "");
  const depot = (d.depot || [])[0]?.stand || (d.depotverlauf || []).slice(-1)[0]?.datum || null;
  return { saldo: saldo?.datum || null, buchungen: buch || null, depot };
}
const standChip = (datum, grenzeTage, name) => {
  if (!datum) return `<span class="chip">${esc(name)}: keine Daten</span>`;
  const t = tageSeit(datum);
  return `<span class="chip ${t > grenzeTage ? "gelb" : ""}">${esc(name)} vom ${datumKurz(datum)}${t > grenzeTage ? ` · ${t} T alt` : ""}</span>`;
};

function einschaetzungKarte(dash) {
  const e = (S.d?.einschaetzung || []).find((x) => x.dashboard === dash);
  if (!e) return `<div class="karte ein amp-gelb"><div class="schlag">Noch keine Einschätzung</div><div class="stand">Der Manager schreibt sie beim nächsten Lauf.</div></div>`;
  const punkte = (e.punkte || []).map((p) => `<li>${esc(p)}</li>`).join("");
  return `<details class="karte ein amp-${esc(e.ampel)}" data-k="ein-${dash}"${offen("ein-" + dash)}><summary><div class="schlag">${esc(e.schlagzeile)}</div>
    <div class="stand">${{ rot: "Achtung", gelb: "Im Blick behalten", gruen: "Auf Kurs" }[e.ampel] || ""} · ${alter(e.stand)}${punkte ? ` · ${(e.punkte || []).length} Punkte` : ""}</div></summary>
    ${punkte ? `<ul>${punkte}</ul>` : ""}${e.text ? `<div class="mehr">${esc(e.text)}</div>` : ""}</details>`;
}
const kachel = (name, wert, sub = "", cls = "") => `<div class="kachel"><div class="name">${esc(name)}</div><div class="wert ${cls}">${wert}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
function hero({ label, wert, einheit = "", sub = "", cls = "", chart = "" }) {
  return `<section class="hero"><div class="lab">${esc(label)}</div><div class="zahl ${cls}" data-privat>${einheit ? `<small>${esc(einheit)}</small>` : ""}${wert}</div>${sub ? `<div class="sub">${sub}</div>` : ""}${chart}</section>`;
}
const zeileKpi = (items) => `<div class="kpis">${items.map((i) => `<div class="kpi"><div class="w ${i.cls || ""}">${i.wert}</div><div class="n">${esc(i.name)}</div>${i.sub ? `<div class="s">${i.sub}</div>` : ""}</div>`).join("")}</div>`;
const sek = (titel, zahl = "", rechts = "") => `<div class="sek"><span>${esc(titel)}</span>${zahl !== "" ? `<span class="zahl">${zahl}</span>` : ""}${rechts}</div>`;
function meter(items, { fmt = (v) => nf0.format(v), max = null, farbe = "var(--s1)" } = {}) {
  const m = max ?? Math.max(1e-9, ...items.map((i) => Math.abs(i.wert)));
  return `<div class="meter">${items.map((i) => `<div class="m ${i.blass ? "blass" : ""}"><div class="kopfz"><span class="lab">${i.name}</span><span class="val">${i.text ?? fmt(i.wert)}</span></div>
    <div class="spur"><i style="width:${Math.max(1.5, Math.min(100, (Math.abs(i.wert) / m) * 100))}%;background:${i.farbe || farbe}"></i>${i.umriss ? `<b style="width:${Math.min(100, (i.umriss / m) * 100)}%"></b>` : ""}</div></div>`).join("")}</div>`;
}
function segment(teile, gesamt = null) {
  const g = gesamt ?? teile.reduce((s, t) => s + t.wert, 0);
  return `<div class="stapel">${teile.filter((t) => t.wert > 0).map((t) => `<i style="width:${(t.wert / Math.max(1e-9, g)) * 100}%;background:${t.farbe}" title="${esc(t.name)}"></i>`).join("")}</div>
    <div class="legende">${teile.map((t) => `<span style="--c:${t.farbe}">${esc(t.name)} ${t.text ?? nf0.format(t.wert)}</span>`).join("")}</div>`;
}

// ---------------------------------------------------------------- Diagramme (SVG, Tooltip per Tippen)
function stufen(lo, hi, n = 4) {
  const roh = (hi - lo) / n || 1, p = Math.pow(10, Math.floor(Math.log10(Math.abs(roh)))), f = roh / p;
  const st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st, out = [];
  for (let v = a; v <= b + st / 2; v += st) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function balken(id, { labels, serien, hoehe = 190, fmt = (v) => chf(v), umriss = [], linieSerie = null, aria = "Balkendiagramm" }) {
  const el = document.getElementById(id); if (!el) return;
  const W = Math.max(300, el.clientWidth || 340), H = hoehe, L = 44, R = 6, T = 8, B = 24;
  const alle = serien.flatMap((s) => s.werte.map((v) => v || 0)).concat(linieSerie ? linieSerie.werte : []);
  const ticks = stufen(0, Math.max(1, ...alle), 3), max = ticks[ticks.length - 1];
  const pw = W - L - R, ph = H - T - B, gw = pw / labels.length;
  const bw = Math.max(4, Math.min(18, (gw - 8) / serien.length - 2));
  const y = (v) => T + ph - (v / max) * ph;
  const jede = Math.max(1, Math.ceil(labels.length / Math.floor(pw / 38)));
  let s = "";
  ticks.forEach((v) => { const yy = y(v); s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="ax" x="${L - 6}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`; });
  labels.forEach((lab, i) => {
    const gx = L + gw * i + (gw - (bw + 2) * serien.length + 2) / 2;
    serien.forEach((se, j) => {
      const v = se.werte[i] || 0, x = gx + j * (bw + 2), yy = y(v), h = T + ph - yy, r = Math.min(4, h, bw / 2);
      const d = h <= 0 ? "" : `M${x},${T + ph} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${T + ph} Z`;
      const u = umriss[i];
      s += `<path d="${d}" fill="${u ? "none" : se.farbe}" stroke="${u ? se.farbe : "none"}" stroke-width="1.5" stroke-dasharray="${u ? "3 2" : ""}" data-tip="${esc(`${lab} · ${se.name}: ${fmt(v)}${u ? " (laufend)" : ""}`)}"/>`;
      s += `<rect x="${x - 1}" y="${T}" width="${bw + 2}" height="${ph}" fill="transparent" data-tip="${esc(`${lab} · ${se.name}: ${fmt(v)}`)}"/>`;
    });
    if (i % jede === 0 || i === labels.length - 1) s += `<text class="ax" x="${L + gw * i + gw / 2}" y="${H - 6}" text-anchor="middle">${esc(lab)}</text>`;
  });
  if (linieSerie) {
    const p = linieSerie.werte.map((v, i) => `${i ? "L" : "M"}${(L + gw * i + gw / 2).toFixed(1)},${y(v || 0).toFixed(1)}`).join(" ");
    s += `<path d="${p}" fill="none" stroke="${linieSerie.farbe}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  s += `<line class="null" x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}"/>`;
  const leg = serien.length > 1 || linieSerie ? `<div class="legende">${serien.map((x) => `<span style="--c:${x.farbe}">${esc(x.name)}</span>`).join("")}${linieSerie ? `<span class="strichleg" style="--c:${linieSerie.farbe}">${esc(linieSerie.name)}</span>` : ""}</div>` : "";
  el.innerHTML = `${leg}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${s}</svg>`;
  tipAn(el);
}
function linie(id, { punkte, hoehe = 180, fmt = (v) => chf(v), farbe = "var(--s1)", nullLinie = false, heuteMarke = false, treppe = false, tief = false, aria = "Verlauf" }) {
  const el = document.getElementById(id); if (!el) return;
  if (punkte.length < 2) { el.innerHTML = `<div class="leer">Der Verlauf erscheint ab zwei Ständen.</div>`; return; }
  const W = Math.max(300, el.clientWidth || 340), H = hoehe, L = 48, R = 8, T = 18, B = 24;
  const xs = punkte.map((p) => +new Date(p.x)), vs = punkte.map((p) => p.y);
  let lo = Math.min(...vs, nullLinie ? 0 : Infinity), hi = Math.max(...vs, nullLinie ? 0 : -Infinity);
  if (lo === hi) { lo -= 1; hi += 1; }
  const tk = stufen(lo, hi, 3); lo = tk[0]; hi = tk[tk.length - 1];
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = (t) => L + ((t - x0) / Math.max(1, x1 - x0)) * (W - L - R), Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const basis = nullLinie && lo < 0 ? Y(0) : T + (H - T - B);
  let s = "";
  tk.forEach((v) => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; });
  let pfad = "";
  punkte.forEach((p, i) => {
    const x = X(+new Date(p.x)).toFixed(1), yy = Y(p.y).toFixed(1);
    pfad += i === 0 ? `M${x},${yy}` : treppe ? ` H${x} V${yy}` : ` L${x},${yy}`;
  });
  const uid = id.replace(/\W/g, "");
  const flaeche = `${pfad} L${X(x1)},${basis} L${X(x0)},${basis} Z`;
  if (nullLinie && lo < 0) {
    s += `<clipPath id="ob-${uid}"><rect x="${L}" y="${T}" width="${W - L - R}" height="${Math.max(0, Y(0) - T)}"/></clipPath><clipPath id="un-${uid}"><rect x="${L}" y="${Y(0)}" width="${W - L - R}" height="${Math.max(0, H - B - Y(0))}"/></clipPath>`;
    s += `<path d="${flaeche}" fill="${farbe}" opacity=".12" clip-path="url(#ob-${uid})"/><path d="${flaeche}" fill="var(--crit)" opacity=".2" clip-path="url(#un-${uid})"/>`;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--crit)" stroke-width="1.2"/>`;
  } else s += `<path d="${flaeche}" fill="${farbe}" opacity=".1"/>`;
  s += `<path d="${pfad}" fill="none" stroke="${farbe}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  const jede = Math.max(1, Math.ceil(punkte.length / Math.max(2, Math.floor((W - L - R) / 70))));
  const mk = punkte.map((_, i) => i).filter((i) => i === 0 || i === punkte.length - 1 || (i % jede === 0 && i < punkte.length - jede / 2));
  const monatsBeschr = (x1 - x0) > 120 * 864e5;
  mk.slice(0, 6).forEach((i, k, a) => { const d = new Date(punkte[i].x); s += `<text class="ax" x="${X(+d)}" y="${H - 6}" text-anchor="${k === 0 ? "start" : k === a.length - 1 ? "end" : "middle"}">${monatsBeschr ? MONATE[d.getMonth()] + " " + String(d.getFullYear()).slice(2) : `${d.getDate()}.${d.getMonth() + 1}.`}</text>`; });
  if (heuteMarke) { const t = +heute(); if (t >= x0 && t <= x1) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H - B}" stroke="var(--text-3)" stroke-dasharray="2 3"/><text class="ax" x="${X(t) + 3}" y="${T - 5}">heute</text>`; }
  if (tief) {
    let bi = 0; vs.forEach((v, i) => { if (v < vs[bi]) bi = i; });
    const tx = X(xs[bi]), ty = Y(vs[bi]), d = new Date(xs[bi]);
    s += `<circle cx="${tx}" cy="${ty}" r="4" fill="${vs[bi] < 0 ? "var(--crit)" : farbe}" stroke="var(--surface)" stroke-width="2"/>`;
    s += `<text class="ax stark" x="${Math.min(W - R - 4, Math.max(L + 4, tx))}" y="${Math.min(H - B - 6, ty + 16)}" text-anchor="${tx > W * 0.7 ? "end" : tx < W * 0.3 ? "start" : "middle"}">Tief ${fmt(vs[bi])} · ${d.getDate()}.${d.getMonth() + 1}.</text>`;
  }
  s += `<line class="kreuz" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="var(--text-2)" stroke-width="1" opacity="0"/><circle class="kp" r="5" fill="${farbe}" stroke="var(--surface)" stroke-width="2" opacity="0"/>`;
  s += `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" class="flaeche"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${s}</svg>`;
  const svg = $("svg", el), fl = $(".flaeche", el), kr = $(".kreuz", el), kp = $(".kp", el);
  const zeige = (e) => {
    const r = svg.getBoundingClientRect(), sx = ((e.clientX - r.left) / r.width) * W;
    const t = x0 + ((sx - L) / (W - L - R)) * (x1 - x0);
    let best = 0; xs.forEach((v, i) => { if (Math.abs(v - t) < Math.abs(xs[best] - t)) best = i; });
    const px = X(xs[best]), py = Y(vs[best]);
    kr.setAttribute("x1", px); kr.setAttribute("x2", px); kr.setAttribute("opacity", ".5");
    kp.setAttribute("cx", px); kp.setAttribute("cy", py); kp.setAttribute("opacity", "1");
    const d = new Date(xs[best]);
    tip.zeig(r.left + (px / W) * r.width, r.top + (py / H) * r.height, `${datumKurz(d)} ${d.getFullYear()} · ${fmt(vs[best])}${punkte[best].info ? " · " + esc(punkte[best].info) : ""}`);
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
  return `<div class="hbar">${items.map((i) => `<div class="lab">${i.punkt ? `<span class="kp" style="--c:${i.punkt}"></span>` : ""}${esc(i.name)}${i.zusatz ? ` <span class="muted klein">${i.zusatz}</span>` : ""}</div><div class="val">${fmt(i.wert)}</div>
    <div class="bar"><i style="width:${Math.max(1.5, (i.wert / max) * 100)}%;background:${i.farbe || farbe}"></i></div>`).join("")}</div>`;
}
// Zeitstrahl-Band (Fristen, Meilensteine): Bahnen mit Rauten, Heute-Linie
function bahnen(id, { von, bis, bahnen: bs }) {
  const el = document.getElementById(id); if (!el) return;
  const W = Math.max(300, el.clientWidth || 340), L = 78, R = 10, T = 18, BH = 30, H = T + bs.length * BH + 14;
  const t0 = +von, t1 = +bis, X = (t) => L + ((t - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  let s = "";
  for (let d = new Date(von); d <= bis; d.setDate(d.getDate() + 1)) {
    if (d.getDate() === 1) s += `<line class="grid" x1="${X(+d)}" x2="${X(+d)}" y1="${T - 4}" y2="${H - 10}"/><text class="ax" x="${X(+d) + 3}" y="${T - 6}">${MONATE[d.getMonth()]}</text>`;
  }
  bs.forEach((b, i) => {
    const y = T + i * BH + BH / 2;
    s += `<text class="ax" x="0" y="${y + 4}">${esc(b.name)}</text><line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/>`;
    b.punkte.filter((p) => +new Date(p.t) >= t0 && +new Date(p.t) <= t1).forEach((p) => {
      const x = X(+new Date(p.t));
      s += `<path d="M${x},${y - 7} L${x + 7},${y} L${x},${y + 7} L${x - 7},${y} Z" fill="${b.farbe}" stroke="var(--surface)" stroke-width="1.5" data-tip="${esc(`${datumKurz(p.t)} · ${p.titel}`)}"/>`;
    });
  });
  const h = +heute(); if (h >= t0 && h <= t1) s += `<line x1="${X(h)}" x2="${X(h)}" y1="${T - 4}" y2="${H - 10}" stroke="var(--crit)" stroke-width="1.2"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fristen auf der Zeitachse">${s}</svg>`;
  tipAn(el);
}

// ---------------------------------------------------------------- Seiten
const istManagerBitte = (a) => /^\s*(für den manager|freischalten)\b[:\s]/i.test(a.titel || "");
function rang(a) {
  if (!a.frist) return a.wichtig >= 3 ? 4 : 5;
  const f = new Date(a.frist), jetzt = new Date();
  if (f < jetzt) return 1;
  if (isoTag(f) === isoTag(jetzt)) return 2;
  if (f - jetzt <= 48 * 36e5) return 3;
  return a.wichtig >= 3 ? 4 : 5;
}
const sortiereAufgaben = (liste) => [...liste].sort((a, b) => rang(a) - rang(b) || (a.frist ? +new Date(a.frist) : 9e15) - (b.frist ? +new Date(b.frist) : 9e15));
function heuteZahlen() {
  const auf = S.d?.aufgaben || [], ende = new Date(heute()); ende.setDate(ende.getDate() + 1);
  const faellig = auf.filter((a) => a.frist && new Date(a.frist) < ende && !istManagerBitte(a));
  return { faellig: faellig.length, minuten: faellig.reduce((s, a) => s + (+a.minuten || 0), 0) };
}

function seiteHeute() {
  const d = S.d || {};
  const alle = sortiereAufgaben(d.aufgaben || []);
  const bitten = alle.filter(istManagerBitte), auf = alle.filter((a) => !istManagerBitte(a));
  const ents = (d.entscheide || []).filter((f) => !f.antwort);
  const jetzt = new Date();
  const naechster = (d.termine || []).filter((t) => !t.ganztags && new Date(t.ende || t.start) > jetzt).sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  const erledigt = (d.manager || []).filter((m) => m.status === "erledigt" && !/^pre-mortem/i.test(m.titel));
  // Heute in 30 Sekunden
  let h = `<section class="karte brief"><div class="brief-kopf">Heute in 30 Sekunden</div><ul class="brief-liste">`;
  if (naechster) h += `<li><span class="ic">${IC.uhr}</span><div><b>${esc(terminTitel(naechster.titel))}</b><div class="meta">${datumKurz(naechster.start)} ${hhmm(naechster.start)} · ${bisText(naechster.start)}${naechster.ort ? " · " + esc(naechster.ort) : ""}</div></div></li>`;
  auf.slice(0, 3).forEach((a, i) => { h += `<li class="tippbar" data-oeffne="${a.id}"><span class="nr">${i + 1}</span><div><b>${esc(a.titel)}</b><div class="meta">${a.frist ? fristText(a.frist, a.frist_mit_zeit) : "ohne Frist"}${a.minuten ? ` · ${a.minuten} Min.` : ""}</div></div></li>`; });
  if (ents.length) { const fr = ents.filter((e) => e.frist).sort((a, b) => new Date(a.frist) - new Date(b.frist))[0];
    h += `<li><span class="ic">${IC.filter}</span><div><b>${ents.length} Entscheid${ents.length > 1 ? "e" : ""} für dich</b><div class="meta">${fr ? "erster bis " + fristText(fr.frist, true) : "ohne Frist"} · unten wischen</div></div></li>`; }
  if (bitten.length) h += `<li><span class="ic warn">!</span><div><b>Manager braucht dich: ${bitten.length}×</b><div class="meta">${bitten.slice(0, 2).map((a) => esc(a.titel.replace(/^\s*(für den manager|freischalten)\s*:?\s*/i, ""))).join(" · ")}</div></div></li>`;
  if (erledigt.length) h += `<li><span class="ic gut">${IC.ok}</span><div><b>Für dich erledigt: ${erledigt.length} in 7 Tagen</b><div class="meta">${esc(erledigt[0].titel.slice(0, 70))}</div></div></li>`;
  h += `</ul></section>`;
  h += einschaetzungKarte("heute");
  if (ents.length) {
    h += sek("Entscheide", ents.length);
    h += `<div class="quer">${ents.map((f, i) => `<article class="karte entscheid" data-id="${f.id}">
      <div class="meta"><span class="muted">${i + 1} von ${ents.length}</span>${f.frist ? `<span class="chip ${new Date(f.frist) < new Date() ? "rot" : "blau"}">${fristText(f.frist, true)}</span>` : ""}${f.typ === "Bewerbung" ? '<span class="chip">Bewerbung</span>' : ""}</div>
      <div class="frage">${esc(ohneCode(f.frage))}</div>
      ${f.kontext ? `<details class="details" data-k="ent-${f.id}"${offen("ent-" + f.id)}><summary>Hintergrund</summary>${esc(f.kontext)}${f.link ? `<br><a ${linkAttr(f.link)}>Öffnen</a>` : ""}</details>` : f.link ? `<div class="details"><a ${linkAttr(f.link)}>Öffnen</a></div>` : ""}
      <input type="text" class="kommentar" placeholder="Kommentar (freiwillig)" maxlength="500">
      <div class="antworten seg">${(f.erlaubt?.length ? f.erlaubt : ["Ja", "Nein", "Später"]).map((a) => `<button class="knopf ${/^(ja|einreichen)$/i.test(a) ? "primaer" : ""}" data-antwort="${esc(a)}">${esc(a)}</button>`).join("")}</div></article>`).join("")}</div>`;
  }
  if (bitten.length) h += sek("Manager braucht dich", bitten.length) + `<div class="karte liste-karte"><ul class="liste">${bitten.map(aufgabeZeile).join("")}</ul></div>`;
  const sicht = S.mehr ? auf : auf.slice(0, 6);
  h += sek("Deine Aufgaben", auf.length, `<button class="alle" id="b-filter2">Ausgeblendet</button>`);
  h += `<div class="karte liste-karte">${auf.length ? `<ul class="liste">${sicht.map(aufgabeZeile).join("")}</ul>` : `<div class="leer gross">Alles erledigt ✓</div>`}
    ${auf.length > 6 ? `<button class="knopf mehrzeigen" id="mehr">${S.mehr ? "Weniger zeigen" : `Alle ${auf.length} zeigen`}</button>` : ""}<div class="wischhinweis">Nach rechts wischen = erledigt · nach links = später</div></div>`;
  h += wocheKarte();
  if (erledigt.length || (d.manager || []).length) {
    const lauf = (d.manager || []).filter((m) => m.status !== "erledigt" && !/^pre-mortem/i.test(m.titel));
    h += sek("Für dich erledigt", erledigt.length ? `${erledigt.length} in 7 T` : "");
    h += `<div class="karte liste-karte"><ul class="liste">${erledigt.slice(0, 6).map((m) => `<li class="zeile-einfach"><span class="haken an">${IC.ok}</span><div><div class="titel">${esc(m.titel)}</div><div class="meta">${m.beleg ? beleg(m.beleg) : "ohne Beleg"} · ${alter(m.geaendert)}</div></div></li>`).join("") || '<li class="leer">Noch nichts diese Woche.</li>'}</ul>
      ${lauf.length ? `<details class="details" data-k="mgr-lauf"${offen("mgr-lauf")}><summary>${lauf.length} in Arbeit beim Manager</summary><ul class="liste">${lauf.map((m) => `<li><div class="titel" style="font-weight:500">${esc(m.titel)}</div><div class="meta">${m.frist ? fristText(m.frist) : ""}</div></li>`).join("")}</ul></details>` : ""}</div>`;
  }
  const ein = d.eingaben || [];
  if (ein.length) h += sek("Deine Nachrichten an den Manager") + `<div class="karte"><ul class="liste">${ein.slice(0, 4).map((e) => `<li><div>${esc(e.text)}</div><div class="meta">${alter(e.erstellt)} · ${e.verarbeitet_am ? "✓ " + esc(e.ergebnis || "erledigt") : "wartet auf den nächsten Lauf"}</div></li>`).join("")}</ul></div>`;
  if (!window.matchMedia("(display-mode: standalone)").matches && !navigator.standalone && /iPhone|iPad/.test(navigator.userAgent))
    h += `<div class="banner">📲 <div>Als App installieren: unten auf <b>Teilen</b> tippen, dann <b>Zum Home-Bildschirm</b>.</div></div>`;
  return h;
}
function beleg(b) {
  const s = String(b || ""); const m = s.match(/https?:\/\/\S+|#s\/[0-9a-f]{32}/i);
  return m ? `<a ${linkAttr(m[0])}>Beleg</a>` : `<span title="${esc(s)}">Beleg: ${esc(s.slice(0, 40))}${s.length > 40 ? "…" : ""}</span>`;
}
function aufgabeZeile(a) {
  const ueber = a.frist && new Date(a.frist) < new Date();
  const cl = a.checkliste || [];
  return `<li class="aufgabe" data-id="${a.id}"><div class="wisch-l">${IC.uhr}<span>Später</span></div><div class="wisch-r">${IC.ok}<span>Erledigt</span></div>
    <div class="aufgabe-in"><button class="haken" data-akt="erledigt" aria-label="Erledigt"></button>
    <div class="inhalt"><div class="titel">${esc(a.titel)}</div>
    <div class="meta">${a.frist ? `<span class="${ueber ? "schlecht" : rang(a) <= 3 ? "warnt" : ""}">${fristText(a.frist, a.frist_mit_zeit)}</span>` : ""}${a.bereich ? `<span>${esc(a.bereich)}</span>` : ""}${a.minuten ? `<span>${a.minuten} Min.</span>` : ""}${cl.length ? `<span>☐ ${cl.filter((c) => c.fertig).length}/${cl.length}</span>` : ""}</div></div>
    <span class="pfeil">›</span></div></li>`;
}
function aufgabeBlatt(id) {
  const a = (S.d.aufgaben || []).find((x) => x.id === id); if (!a) return;
  const cl = a.checkliste || [];
  blatt(`<h3>${esc(a.titel)}</h3><div class="meta" style="margin:-6px 0 12px">${a.frist ? `<span class="chip ${new Date(a.frist) < new Date() ? "rot" : "blau"}">${fristText(a.frist, a.frist_mit_zeit)}</span>` : ""}${a.bereich ? `<span class="chip">${esc(a.bereich)}</span>` : ""}${a.minuten ? `<span class="chip">${a.minuten} Min.</span>` : ""}</div>
    ${cl.length ? `<div class="klein muted">Checkliste</div>${cl.map((c) => `<div class="check ${c.fertig ? "fertig" : ""}"><span class="b"></span><span>${esc(c.text)}</span></div>`).join("")}` : ""}
    ${a.notiz ? `<div class="klein muted" style="margin-top:10px">Nächster Schritt</div><div class="details" style="margin-top:2px">${esc(a.notiz)}</div>` : ""}
    ${a.quelle ? `<div class="klein muted" style="margin-top:10px">Quelle</div><div class="details" style="margin-top:2px">${/^https?:/i.test(a.quelle) ? `<a ${linkAttr(a.quelle)}>Öffnen</a>` : esc(a.quelle)}</div>` : ""}
    ${a.notion_id ? `<div class="details"><a href="#s/${a.notion_id.replace(/-/g, "")}" id="b-im-speicher">Im Speicher öffnen</a></div>` : ""}
    <div class="knoepfe"><button class="knopf gut" data-akt="erledigt">${IC.ok}Erledigt</button><button class="knopf" data-akt="spaeter">${IC.uhr}Später</button><button class="knopf weg" data-akt="verworfen">${IC.weg}Nicht relevant</button></div>`, (b) => {
    $$("[data-akt]", b).forEach((k) => k.onclick = () => { blattZu(); aufgabeAktion(id, k.dataset.akt); });
    const sp = $("#b-im-speicher", b); if (sp) sp.onclick = () => blattZu();
  });
}
// Wischen: rechts = erledigt, links = später; Tippen = Details
function wischen(li) {
  const inn = $(".aufgabe-in", li); let x0 = null, y0 = 0, dx = 0, aktiv = false;
  li.addEventListener("pointerdown", (e) => { if (e.target.closest(".haken")) return; x0 = e.clientX; y0 = e.clientY; dx = 0; aktiv = false; });
  li.addEventListener("pointermove", (e) => {
    if (x0 == null) return; dx = e.clientX - x0;
    if (!aktiv && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(e.clientY - y0)) { aktiv = true; li.setPointerCapture?.(e.pointerId); li.classList.add("zieht"); }
    if (aktiv) { inn.style.transform = `translateX(${dx}px)`; li.classList.toggle("rechts", dx > 0); li.classList.toggle("bereit", Math.abs(dx) > 90); }
  });
  const ende = () => {
    if (x0 == null) return; const war = aktiv, d = dx; x0 = null; li.classList.remove("zieht", "bereit");
    if (!war) { if (Math.abs(d) < 8) aufgabeBlatt(li.dataset.id); return; }
    if (d > 90) { inn.style.transform = "translateX(110%)"; li.classList.add("weg"); setTimeout(() => aufgabeAktion(li.dataset.id, "erledigt"), 180); }
    else { inn.style.transform = ""; if (d < -90) aufgabeAktion(li.dataset.id, "spaeter"); }
  };
  li.addEventListener("pointerup", ende); li.addEventListener("pointercancel", () => { x0 = null; inn.style.transform = ""; li.classList.remove("zieht", "bereit"); });
}
function wocheKarte() {
  const d = S.d || {}, tage = [];
  for (let i = 0; i < 7; i++) {
    const tg = plusTage(i), k = isoTag(tg);
    const ter = (d.termine || []).filter((t) => isoTag(t.start) === k).sort((a, b) => new Date(a.start) - new Date(b.start));
    const fr = [
      ...(d.aufgaben || []).filter((a) => a.frist && isoTag(a.frist) === k).map((a) => ({ t: a.frist, titel: a.titel, art: "Frist" })),
      ...(d.abgaben || []).filter((a) => a.frist && isoTag(a.frist) === k).map((a) => ({ t: a.frist, titel: a.titel, art: "Abgabe" })),
      ...(d.bewerbungen || []).filter((b) => b.frist && isoTag(b.frist) === k && !["abgesagt", "geschlossen"].includes(b.status)).map((b) => ({ t: b.frist, titel: `${b.firma || ""}: ${stelleTeile(b.stelle)[0]}`, art: "Bewerbung" })),
    ];
    const fest = ter.filter((t) => !t.ganztags && !istBlock(t));
    const konflikte = [];
    const timed = ter.filter((t) => !t.ganztags);
    timed.forEach((a, i2) => timed.slice(i2 + 1).forEach((b) => { if (new Date(b.start) < new Date(a.ende || +new Date(a.start) + 36e5)) konflikte.push(`${hhmm(a.start)} ${terminTitel(a.titel).slice(0, 26)} ↔ ${terminTitel(b.titel).slice(0, 26)}`); }));
    const wt = tg.getDay();
    if (wt >= 1 && wt <= 3) ter.filter((t) => istBlock(t) && !t.ganztags).forEach((t) => { const hh = new Date(t.start).getHours(); if (hh >= 8 && hh < 17) konflikte.push(`${hhmm(t.start)} Block in der E+H-Zeit: ${terminTitel(t.titel).slice(0, 30)}`); });
    if (fest.length > 2) konflikte.push(`${fest.length} feste Termine`);
    tage.push({ tg, k, ter, fr, konflikte });
  }
  const name = (tg, i) => (i === 0 ? "Heute" : i === 1 ? "Morgen" : `${TAGE[tg.getDay()]} ${tg.getDate()}.${tg.getMonth() + 1}.`);
  const total = tage.reduce((s, t) => s + t.konflikte.length, 0);
  return sek("Diese Woche", total ? `<span class="chip gelb">${total} Konflikt${total > 1 ? "e" : ""}</span>` : "") + `<div class="karte woche">${tage.map((t, i) => {
    const kk = "tag-" + t.k, auf = S.offen.has(kk) || (i < 2 && !S.offen.has(kk + "-zu"));
    return `<details class="tagz" data-k="${kk}"${auf ? " open" : ""}><summary><span class="tn">${name(t.tg, i)}</span><span class="tz">${t.ter.length ? `${t.ter.length} Termin${t.ter.length > 1 ? "e" : ""}` : ""}${t.fr.length ? ` · ${t.fr.length} Frist${t.fr.length > 1 ? "en" : ""}` : ""}${!t.ter.length && !t.fr.length ? "frei" : ""}</span>${t.konflikte.length ? `<span class="chip gelb">⚠ ${t.konflikte.length}</span>` : ""}</summary>
      ${t.konflikte.map((x) => `<div class="konflikt">⚠ ${esc(x)}</div>`).join("")}
      ${t.ter.map((x) => `<div class="termin"><div class="zeit">${x.ganztags ? "ganztags" : hhmm(x.start) + (x.ende && !x.ganztags ? `<br><span class="muted">${hhmm(x.ende)}</span>` : "")}</div><div class="strich" style="background:${terminFarbe(x)}"></div><div class="was"><div class="titel" style="font-weight:500">${esc(terminTitel(x.titel))}</div><div class="meta">${istBlock(x) ? "Block vom Manager" : ""}${x.ort ? (istBlock(x) ? " · " : "") + esc(x.ort) : ""}</div></div></div>`).join("")}
      ${t.fr.map((x) => `<div class="termin"><div class="zeit">${hhmm(x.t)}</div><div class="strich" style="background:var(--crit)"></div><div class="was"><div class="titel" style="font-weight:500">${esc(x.titel)}</div><div class="meta">${x.art}</div></div></div>`).join("")}
      ${!t.ter.length && !t.fr.length ? '<div class="leer">Nichts eingetragen.</div>' : ""}</details>`;
  }).join("")}</div>`;
}
function terminKarte(termine, titel, fuss = "") {
  if (!termine.length) return sek(titel) + `<div class="karte"><div class="leer">Keine Termine erfasst.</div>${fuss}</div>`;
  const tage = {};
  termine.forEach((t) => { const k = isoTag(t.start); (tage[k] ||= []).push(t); });
  return sek(titel, termine.length) + `<div class="karte">${Object.entries(tage).map(([k, ts]) => {
    const tg = new Date(k), diff = Math.round((d0(tg) - heute()) / 864e5);
    const name = diff === 0 ? "Heute" : diff === 1 ? "Morgen" : `${TAGE[tg.getDay()]} ${tg.getDate()}. ${MONATE[tg.getMonth()]}`;
    return `<div class="tag">${name}</div>${ts.map((t) => `<div class="termin"><div class="zeit">${t.ganztags ? "ganztags" : hhmm(t.start)}</div><div class="strich" style="background:${terminFarbe(t)}"></div><div class="was"><div class="titel" style="font-weight:500">${esc(terminTitel(t.titel))}</div>${t.ort ? `<div class="meta">${esc(t.ort)}</div>` : ""}</div></div>`).join("")}`;
  }).join("")}${fuss}</div>`;
}
function terminArt(t) {
  const k = String(t.kategorie || "").toLowerCase();
  if (["job", "karriere", "bewerbung"].includes(k)) return "job";
  if (["uni", "studium"].includes(k)) return "uni";
  const s = `${t.titel} ${t.ort || ""}`;
  const firmen = (S.d?.bewerbungen || []).filter((b) => !["abgesagt", "geschlossen", "entdeckt"].includes(b.status)).map((b) => (b.firma || "").split(/\s+/)[0]).filter((f) => f.length >= 3);
  if (/interview|bewerb|assessment|recruit/i.test(s) || firmen.some((f) => s.toLowerCase().includes(f.toLowerCase()))) return "job";
  if (/hsg|case|vorlesung|prüfung|pruefung|ma-|masterarbeit|canvas|kurs|seminar|lernen|amazonia/i.test(s)) return "uni";
  if (istBlock(t)) return "block";
  return "privat";
}
const terminFarbe = (t) => ({ job: "var(--s1)", uni: "var(--s3)", block: "var(--s7)", privat: "var(--s4)" }[terminArt(t)]);

// ---------------------------------------------------------------- Jobs
const EING = ["eingereicht", "assessment", "interview", "angebot", "abgesagt"];
const statusName = (s) => ({ entdeckt: "entdeckt", dossier_bereit: "Dossier bereit", freigegeben: "freigegeben", eingereicht: "eingereicht", assessment: "Test", interview: "Interview", angebot: "Angebot", abgesagt: "Absage", geschlossen: "geschlossen" }[s] || s);
function jobZahlen() {
  const b = S.d?.bewerbungen || [];
  const eing = b.filter((x) => x.eingereicht_am || EING.includes(x.status));
  const antw = (x) => x.antwort_am || ["assessment", "interview", "angebot", "abgesagt"].includes(x.status);
  const test = (x) => x.test_am || x.interview_am || ["assessment", "interview", "angebot"].includes(x.status);
  const gespr = (x) => x.interview_am || ["interview", "angebot"].includes(x.status);
  const reif = eing.filter((x) => x.eingereicht_am && tageSeit(x.eingereicht_am) >= 21);
  return { b, eing, antw, test, gespr, reif };
}
function seiteJobs() {
  const { b, eing, antw, test, gespr, reif } = jobZahlen();
  const aktivGespr = b.filter((x) => ["interview", "angebot"].includes(x.status));
  const tests = b.filter((x) => x.status === "assessment");
  const w7 = eing.filter((x) => x.eingereicht_am && tageSeit(x.eingereicht_am) < 7).length;
  const wochen = jobWochen(), schnitt = wochen.slice(-5, -1).reduce((s, w) => s + w.n, 0) / 4;
  let h = hero({ label: "Echte Gespräche", wert: nf0.format(b.filter(gespr).length), sub: `${aktivGespr.length} laufend · ${tests.length} Test${tests.length === 1 ? "" : "s"} offen · ${eing.length} eingereicht` });
  h += zeileKpi([
    { name: "Diese Woche", wert: nf0.format(w7), sub: `Ø ${nf0.format(schnitt * 10) / 10} pro Woche` },
    { name: "Antwortquote", wert: pct(reif.filter(antw).length / Math.max(1, reif.length)), sub: `ab 21 T · n=${reif.length}` },
    { name: "Gesprächsquote", wert: pct(reif.filter(gespr).length / Math.max(1, reif.length)), sub: `ab 21 T · n=${reif.length}` },
  ]);
  h += einschaetzungKarte("jobs");
  const stufen = [["Eingereicht", eing.length], ["Antwort", eing.filter(antw).length], ["Test oder Gespräch", eing.filter(test).length], ["Gespräch", eing.filter(gespr).length], ["Angebot", eing.filter((x) => x.angebot_am || x.status === "angebot").length]];
  const farbT = ["#86b6ef", "#5e9be6", "#3a7fd9", "#2563b8", "#104281"];
  h += sek("Trichter") + `<div class="karte">${meter(stufen.map(([n, v], i) => ({ name: esc(n), wert: v, text: `${nf0.format(v)}${i ? ` <span class="muted">· ${pct(v / Math.max(1, stufen[i - 1][1]))}</span>` : ""}`, farbe: farbT[i] })), { max: Math.max(1, eing.length) })}
    <div class="klein muted" style="margin-top:6px">Online-Tests zählen als «Test», nicht als Gespräch. Quote jeweils zur Vorstufe.</div></div>`;
  h += sek("Takt pro Woche") + `<div class="karte"><div class="chart" id="c-wochen"></div></div>`;
  const wartend = b.filter((x) => x.status === "eingereicht" && x.eingereicht_am);
  const alt = [[0, 7, "0–7 T", "var(--s3)"], [8, 21, "8–21 T", "var(--s1)"], [22, 42, "22–42 T", "var(--s4)"], [43, 1e4, "über 42 T", "var(--s8)"]].map(([a, z, n, f]) => ({ name: n, wert: wartend.filter((x) => { const t = tageSeit(x.eingereicht_am); return t >= a && t <= z; }).length, farbe: f }));
  h += sek("Warten auf Antwort", wartend.length) + `<div class="karte">${segment(alt.map((x) => ({ ...x, text: String(x.wert) })))}
    ${wartend.filter((x) => tageSeit(x.eingereicht_am) > 21).length ? `<div class="klein muted">Über 21 Tage ohne Antwort: ${wartend.filter((x) => tageSeit(x.eingereicht_am) > 21).map((x) => esc(x.firma || "")).join(", ")}</div>` : ""}</div>`;
  const bereit = b.filter((x) => ["dossier_bereit", "freigegeben"].includes(x.status));
  const lauf = [...aktivGespr, ...tests, ...bereit, ...wartend.sort((a, z) => (z.eingereicht_am || "").localeCompare(a.eingereicht_am || ""))];
  const jobTermine = (S.d?.termine || []).filter((t) => new Date(t.ende || t.start) >= new Date());
  h += sek("Läuft gerade", lauf.length) + `<div class="karte liste-karte"><ul class="liste">${lauf.slice(0, S.alleBew ? 99 : 8).map((x) => {
    const [titel, ref] = stelleTeile(x.stelle);
    const fw = (x.firma || "").split(/\s+/)[0].toLowerCase();
    const termin = fw.length >= 2 ? jobTermine.find((t) => t.titel.toLowerCase().includes(fw) && /interview|gespräch|assessment|call/i.test(t.titel)) : null;
    let rechts;
    if (x.status === "interview") rechts = `<span class="chip gruen">Gespräch</span><div class="meta">${termin ? datumKurz(termin.start) : "Termin offen"}</div>`;
    else if (x.status === "angebot") rechts = `<span class="chip gruen">Angebot</span>`;
    else if (x.status === "assessment") rechts = `<span class="chip lila">Test offen</span>${x.frist ? `<div class="meta">${fristText(x.frist)}</div>` : ""}`;
    else if (x.status === "eingereicht") { const t = tageSeit(x.eingereicht_am); rechts = `<div class="meta ${t > 21 ? "blass" : ""}">seit ${t} T</div>`; }
    else rechts = `<span class="chip gelb">${esc(statusName(x.status))}</span>`;
    return `<li><div class="reihe mit-mono">${mono(x.firma)}<div class="l"><div class="titel">${esc(titel)}</div><div class="meta">${esc(x.firma || "")}${x.ort ? " · " + esc(x.ort) : ""}${ref ? ` · <span class="muted">${esc(ref)}</span>` : ""}</div></div><div class="r">${rechts}</div></div></li>`;
  }).join("") || '<li class="leer">Nichts in Arbeit.</li>'}</ul>${lauf.length > 8 ? `<button class="knopf mehrzeigen" id="alle-bew">${S.alleBew ? "Weniger" : `Alle ${lauf.length} zeigen`}</button>` : ""}</div>`;
  const erf = S.d?.erfolg || [], dim = S.jobDim || "Rollentyp";
  const dims = ["Rollentyp", "Vorlage", "Kanal"].filter((x) => erf.some((e) => e.dimension === x));
  const rows = erf.filter((e) => e.dimension === dim).map((r) => ({ ...r, nn: r.n_reif ?? r.n, ii: r.interviews_reif ?? r.interviews })).sort((a, z) => z.nn - a.nn);
  h += sek("Wo es klappt") + `<div class="karte"><div class="seg-schalter">${dims.map((x) => `<button class="${x === dim ? "an" : ""}" data-dim="${x}">${x}</button>`).join("")}</div>
    ${meter(rows.map((r) => ({ name: esc(r.wert), wert: r.ii / Math.max(1, r.nn), text: `${r.ii}/${r.nn} · ${pct(r.ii / Math.max(1, r.nn))}`, blass: r.nn < 5, farbe: "var(--s3)" })), { max: Math.max(0.25, ...rows.map((r) => r.ii / Math.max(1, r.nn))) })}
    <div class="klein muted" style="margin-top:6px">Balken = Gesprächsquote${rows.some((r) => r.n_reif != null) ? " der Bewerbungen ab 21 Tagen" : ""}. Unter 5 Fällen blass: noch keine Aussage.${dim === "Vorlage" ? " Vorlage nach Einreichedatum: v1 bis 8.11., v2 ab 9.11., v3 ab 12.11." : ""}</div></div>`;
  h += terminKarte(jobTermine.filter((t) => terminArt(t) === "job"), "Job-Termine");
  const zu = b.filter((x) => ["abgesagt", "geschlossen"].includes(x.status)).slice(0, 12);
  h += sek("Abgeschlossen") + `<div class="karte"><details class="details" data-k="job-zu"${offen("job-zu")}><summary>${b.filter((x) => x.status === "abgesagt").length} Absagen, ${b.filter((x) => x.status === "geschlossen").length} geschlossen</summary>
    <ul class="liste" style="margin-top:8px">${zu.map((x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(stelleTeile(x.stelle)[0])}</div><div class="meta">${esc(x.firma || "")}</div></div><div class="r"><span class="chip">${esc(statusName(x.status))}</span></div></div></li>`).join("")}</ul></details></div>`;
  return h;
}
function jobWochen() {
  const b = S.d?.bewerbungen || [], start = new Date(heute()); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 15 * 7);
  const out = [];
  for (let i = 0; i < 16; i++) {
    const a = new Date(start); a.setDate(a.getDate() + i * 7); const z = new Date(a); z.setDate(z.getDate() + 7);
    const n = b.filter((x) => x.eingereicht_am && new Date(x.eingereicht_am) >= a && new Date(x.eingereicht_am) < z).length;
    const kw = (() => { const t = new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())); const tag = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - tag); const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - j) / 864e5 + 1) / 7); })();
    out.push({ a, n, kw, laufend: i === 15 });
  }
  return out;
}
function chartsJobs() {
  const w = jobWochen();
  const avg = w.map((_, i) => { const s = w.slice(Math.max(0, i - 3), i + 1); return s.reduce((x, y) => x + y.n, 0) / s.length; });
  balken("c-wochen", { labels: w.map((x) => "KW " + x.kw), serien: [{ name: "Eingereicht", farbe: "var(--s1)", werte: w.map((x) => x.n) }],
    umriss: w.map((x) => x.laufend), linieSerie: { name: "Ø 4 Wochen", farbe: "var(--s2)", werte: avg }, fmt: (v) => nf0.format(v), hoehe: 170,
    aria: `Bewerbungen pro Woche, letzte 16 Wochen; diese Woche ${w[15].n}` });
}

// ---------------------------------------------------------------- Geld
function monateVoll(n) {
  const out = [], d = new Date(); d.setDate(1);
  for (let i = n; i >= 1; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(isoTag(x)); }
  return out;
}
const KAT_FARBE = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s7)", "var(--s8)", "var(--s6)"];
function minusPhasen(prog) {
  const out = []; let a = null;
  prog.forEach((p, i) => { if (+p.saldo < 0 && !a) a = p; if ((+p.saldo >= 0 || i === prog.length - 1) && a) { out.push({ von: a.datum, bis: +p.saldo >= 0 ? prog[i - 1].datum : null }); a = null; } });
  return out;
}
function seiteGeld() {
  const d = S.d || {}, ds = datenStand();
  const fm = (d.finanzmonat || []).filter((m) => !ds.buchungen || m.monat <= ds.buchungen);
  const vollMonate = fm.filter((m) => { const e = new Date(m.monat); e.setMonth(e.getMonth() + 1); e.setDate(0); return ds.buchungen && isoTag(e) <= ds.buchungen; }).slice(-12);
  const ein = vollMonate.reduce((s, m) => s + (+m.einnahmen || 0), 0), aus = vollMonate.reduce((s, m) => s + (+m.ausgaben || 0), 0);
  const quote = ein ? (ein - aus) / ein : null;
  const saldo = (d.saldo || []).find((s) => s.konto === "privatkonto");
  const prog = d.prognose || [];
  const tief = prog.length ? prog.reduce((a, b) => (+b.saldo < +a.saldo ? b : a)) : null;
  const phasen = minusPhasen(prog), unter = prog.filter((p) => +p.saldo < 0).length;
  const fmt = (x) => (x == null ? "–" : chf(x).replace("-", MINUS));
  let h = hero({ label: "Privatkonto", einheit: "CHF", wert: fmt(saldo ? +saldo.saldo : null), cls: saldo && +saldo.saldo < 0 ? "schlecht" : "",
    sub: `${standChip(ds.saldo, 7, "Saldo")}${standChip(ds.buchungen, 35, "Buchungen")}` });
  h += `<div class="karte"><div class="karte-kopf"><span>Kontostand · Prognose ${prog.length} Tage</span></div><div class="chart" id="c-prognose"></div>
    ${phasen.length ? `<div class="phasen">${phasen.map((p) => `<span class="chip rot">${datumKurz(p.von)}${p.bis ? "–" + datumKurz(p.bis) : " und weiter"}</span>`).join("")}</div>` : ""}
    <div class="klein muted">Rote Fläche = Konto im Minus. Annahmen und Fixposten aus der Liquiditätsplanung.</div></div>`;
  h += zeileKpi([
    { name: "Erste Unterdeckung", wert: phasen[0] ? datumKurz(phasen[0].von) : "keine", cls: phasen[0] ? "schlecht" : "gut", sub: phasen[0] ? `${phasen.length} Phase${phasen.length > 1 ? "n" : ""}` : "im Horizont" },
    { name: "Tage unter 0", wert: `${unter}<small>/${prog.length}</small>`, cls: unter ? "schlecht" : "gut", sub: tief ? `Tief ${fmt(+tief.saldo)}` : "" },
    { name: "Sparquote", wert: pct(quote).replace("-", MINUS), cls: quote != null && quote < 0.1 ? "schlecht" : "", sub: `${vollMonate.length} volle Monate` },
  ]);
  h += einschaetzungKarte("finanzen");
  h += sek("Einnahmen und Ausgaben", "", `<span class="zahl">pro Monat</span>`) + `<div class="karte"><div class="chart" id="c-monate"></div></div>`;
  const am = (d.ausgabenmonat || []).filter((r) => r.kategorie !== "Gesundheit");
  const v3 = monateVoll(3), v6 = monateVoll(6).slice(0, 3), kat = {};
  am.forEach((r) => { const k = r.kategorie; kat[k] ||= { a: 0, b: 0 }; if (v3.includes(r.monat)) kat[k].a += +r.ausgaben / 3; if (v6.includes(r.monat)) kat[k].b += +r.ausgaben / 3; });
  const katItems = Object.entries(kat).map(([name, x]) => ({ name, wert: x.a, delta: x.a - x.b })).filter((x) => x.wert > 5).sort((a, b) => b.wert - a.wert);
  h += sek("Wohin das Geld geht", "", `<span class="zahl">Ø pro Monat</span>`) + `<div class="karte"><div class="klein muted" style="margin:0 0 10px">Letzte 3 Monate, in Klammern die Veränderung zu den 3 davor. Quartalszahlungen verzerren diesen Vergleich.</div>
    ${hbalken(katItems.slice(0, 10).map((k, i) => ({ ...k, punkt: KAT_FARBE[i % 8], farbe: KAT_FARBE[i % 8], zusatz: Math.abs(k.delta) >= 10 ? `(${vz(k.delta)})` : "" })))}</div>`;
  const abos = d.abos || [];
  h += sek("Fixkosten und Abos", abos.length) + `<div class="karte liste-karte">${abos.length ? `<ul class="liste">${abos.map((a) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(haendler(a.name))}</div><div class="meta">${esc(a.rhythmus || "")}${a.vorschlag ? " · " + esc(a.vorschlag) : ""}</div></div><div class="r" data-privat>${chf(+a.betrag, 2)}</div></div></li>`).join("")}</ul>` : '<div class="leer">Noch keine erkannt.</div>'}</div>`;
  const bu = (d.buchungen || []).filter((x) => !x.intern && +x.betrag < 0 && x.kategorie !== "Gesundheit").slice(0, 20), tage = {};
  bu.forEach((x) => (tage[x.datum] ||= []).push(x));
  const katFarbe = Object.fromEntries(katItems.map((k, i) => [k.name, KAT_FARBE[i % 8]]));
  h += sek("Letzte Ausgaben") + `<div class="karte">${Object.entries(tage).map(([t, xs]) => `<div class="tag">${datumKurz(t)}<span class="muted" data-privat> · ${chf(-xs.reduce((s, x) => s + +x.betrag, 0))}</span></div>
    ${xs.map((x) => `<div class="reihe buch"><div class="l"><span class="kp" style="--c:${katFarbe[x.kategorie] || "var(--text-3)"}"></span>${esc(haendler(x.text))}<span class="meta"> · ${esc(x.kategorie || "Unklar")}${x.konto === "kreditkarte" ? " · Karte" : ""}</span></div><div class="r" data-privat>${chf(-x.betrag, 2)}</div></div>`).join("")}`).join("") || '<div class="leer">Keine Buchungen der letzten 45 Tage.</div>'}</div>`;
  return h;
}
function chartsGeld() {
  const ds = datenStand();
  const fm = (S.d?.finanzmonat || []).slice(-12);
  const unvoll = fm.map((m) => { const e = new Date(m.monat); e.setMonth(e.getMonth() + 1); e.setDate(0); return !ds.buchungen || isoTag(e) > ds.buchungen; });
  balken("c-monate", { labels: fm.map((m) => { const x = new Date(m.monat); return `${MONATE[x.getMonth()]} ${String(x.getFullYear()).slice(2)}`; }),
    serien: [{ name: "Einnahmen", farbe: "var(--s1)", werte: fm.map((m) => +m.einnahmen || 0) }, { name: "Ausgaben", farbe: "var(--s2)", werte: fm.map((m) => +m.ausgaben || 0) }],
    umriss: unvoll, aria: "Einnahmen und Ausgaben pro Monat; unvollständige Monate gestrichelt" });
  linie("c-prognose", { punkte: (S.d?.prognose || []).map((p) => ({ x: p.datum, y: +p.saldo })), nullLinie: true, heuteMarke: true, treppe: true, tief: true,
    fmt: (v) => chf(v).replace("-", MINUS), aria: "Prognose des Kontostands mit Minus-Phasen" });
}

// ---------------------------------------------------------------- Depot
const HEBEL = { "18MF:xetr": 2 };
function depotZahlen() {
  const d = S.d || {}, pos = d.depot || [];
  const heb = { ...HEBEL, ...Object.fromEntries((d.instrumente || []).map((i) => [i.symbol, +i.hebel || 1])) };
  const ws = pos.filter((p) => p.art !== "CFD"), cfd = pos.filter((p) => p.art === "CFD");
  const wertWs = ws.reduce((s, p) => s + (+p.wert_chf || 0), 0), cfdBew = cfd.reduce((s, p) => s + (+p.wert_chf || 0), 0);
  const vl = (d.depotverlauf || []).slice(-1)[0], cash = vl ? +vl.cash_chf || 0 : 0;
  const nav = wertWs + cfdBew + cash;
  const kern = ws.filter((p) => p.topf === "kern").reduce((s, p) => s + (+p.wert_chf || 0), 0);
  const kernEng = ws.filter((p) => p.topf === "kern").reduce((s, p) => s + (+p.wert_chf || 0) * (heb[p.symbol] || 1), 0);
  const tradEng = ws.filter((p) => p.topf !== "kern").reduce((s, p) => s + (+p.wert_chf || 0) * (heb[p.symbol] || 1), 0);
  const cfdEng = cfd.reduce((s, p) => s + Math.abs(+p.engagement_chf || 0), 0);
  const brutto = kernEng + tradEng + cfdEng;
  const groesste = ws.reduce((m, p) => (+p.wert_chf > (m ? +m.wert_chf : -1) ? p : m), null);
  const effPos = wertWs ** 2 / Math.max(1e-9, ws.reduce((s, p) => s + (+p.wert_chf || 0) ** 2, 0));
  const gv = pos.reduce((s, p) => s + (+p.gv_chf || 0), 0);
  return { pos, ws, cfd, wertWs, cfdBew, cash, nav, kern, kernEng, tradEng, cfdEng, brutto, groesste, effPos, gv, vl, heb, stand: pos[0]?.stand };
}
function seiteDepot() {
  const z = depotZahlen(), ds = datenStand();
  const fmtV = (x) => vz(x);
  let h = hero({ label: "Depot (Saxo)", einheit: "CHF", wert: chf(z.nav),
    sub: `<span class="muted">Wertschriften ${chf(z.wertWs)} · CFD ${vz(z.cfdBew)} · Cash ${chf(z.cash)}</span><br>${standChip(ds.depot, 4, "Stand")}${z.vl && Math.abs(+z.vl.wert_chf - z.nav) / Math.max(1, z.nav) > 0.005 ? `<span class="chip">Saxo-Kontowert ${chf(+z.vl.wert_chf)}</span>` : ""}` });
  h += zeileKpi([
    { name: "G/V offen", wert: fmtV(z.gv), cls: z.gv >= 0 ? "gut" : "schlecht", sub: "inkl. CFD" },
    { name: "Effektiver Hebel", wert: (z.brutto / Math.max(1, z.nav)).toFixed(1).replace(".", ",") + "×", sub: `Engagement ${chf(z.brutto)}` },
    { name: "Grösste Position", wert: pct((+z.groesste?.wert_chf || 0) / Math.max(1, z.wertWs)), sub: `≈ ${nf0.format(z.effPos)} gleich grosse` },
  ]);
  h += einschaetzungKarte("depot");
  const mx = Math.max(z.brutto, z.nav);
  const zeile = (name, teile) => `<div class="aufteil"><div class="klein muted">${name}</div><div class="stapel" style="width:${(teile.reduce((s, t) => s + t.wert, 0) / Math.max(1, mx)) * 100}%">${teile.filter((t) => t.wert > 0).map((t) => `<i style="flex:${t.wert} 0 0;background:${t.farbe}" title="${esc(t.name)}"></i>`).join("")}</div></div>`;
  h += sek("Aufteilung") + `<div class="karte">${zeile("Marktwert", [{ name: "Kern", wert: z.kern, farbe: "var(--s1)" }, { name: "Trading", wert: z.wertWs - z.kern, farbe: "var(--s2)" }, { name: "Cash", wert: z.cash, farbe: "var(--text-3)" }])}
    ${zeile("Engagement (mit Hebel)", [{ name: "Kern", wert: z.kernEng, farbe: "var(--s1)" }, { name: "Trading", wert: z.tradEng, farbe: "var(--s2)" }, { name: "CFD", wert: z.cfdEng, farbe: "var(--s4)" }])}
    <div class="legende"><span style="--c:var(--s1)">Kern ${pct(z.kern / Math.max(1, z.nav))}</span><span style="--c:var(--s2)">Trading ${pct((z.wertWs - z.kern) / Math.max(1, z.nav))}</span><span style="--c:var(--s4)">CFD-Engagement ${chf(z.cfdEng)}</span><span style="--c:var(--text-3)">Cash ${chf(z.cash)}</span></div>
    <div class="klein muted">Gleiche Skala: Der längere zweite Balken zeigt, wie stark Hebel-ETF und CFDs das Engagement über den Marktwert heben.</div></div>`;
  const sorted = [...z.pos].sort((a, b) => (b.art === "CFD" ? Math.abs(+b.engagement_chf) : +b.wert_chf) - (a.art === "CFD" ? Math.abs(+a.engagement_chf) : +a.wert_chf));
  h += sek("Positionen", z.pos.length) + `<div class="karte">${meter(sorted.map((p) => ({
    name: `${esc(p.name || p.symbol)} ${p.art === "CFD" ? '<span class="chip gelb">CFD</span>' : (z.heb[p.symbol] || 1) > 1 ? `<span class="chip">${z.heb[p.symbol]}×</span>` : ""}`,
    wert: p.art === "CFD" ? 0 : +p.wert_chf, umriss: p.art === "CFD" ? Math.abs(+p.engagement_chf) : null,
    text: `<span data-privat>${p.art === "CFD" ? chf(Math.abs(+p.engagement_chf)) : chf(+p.wert_chf)}</span> <span class="${+p.gv_chf >= 0 ? "gut" : "schlecht"}">${p.gv_pct != null ? pct(+p.gv_pct, 1).replace("-", MINUS) : vz(+p.gv_chf)}</span>`,
    farbe: p.topf === "kern" ? "var(--s1)" : "var(--s2)",
  })), { max: Math.max(1, ...z.pos.map((p) => (p.art === "CFD" ? Math.abs(+p.engagement_chf) : +p.wert_chf))) })}
    <div class="klein muted">Balken = Wert (CFD: Engagement als Umriss). Rechts G/V seit Kauf.</div></div>`;
  h += sek("Depotwert") + `<div class="karte"><div class="chart" id="c-depot"></div></div>`;
  const ch = S.d?.chancen || [];
  const art = { termin: ["Termin", "blau"], signal: ["Signal", "gruen"], idee: ["Idee", ""], risiko: ["Risiko", "rot"] };
  h += sek("Chancen-Radar", ch.length) + `<div class="karte liste-karte">${ch.length ? `<ul class="liste">${ch.map((c) => `<li><div class="titel">${esc(c.titel)}</div><div class="meta"><span class="chip ${art[c.art]?.[1] || ""}">${art[c.art]?.[0] || c.art}</span>${c.symbol ? `<span class="chip">${esc(c.symbol)}</span>` : ""}${c.gueltig_bis ? "bis " + datumKurz(c.gueltig_bis) : ""}</div>${c.text ? `<details class="details" data-k="ch-${c.id}"${offen("ch-" + c.id)}><summary>Warum</summary>${esc(c.text)}</details>` : ""}</li>`).join("")}</ul>` : '<div class="leer">Der Manager füllt das Radar beim nächsten Lauf.</div>'}</div>`;
  const tr = S.d?.trades || [];
  h += sek("Letzte Trades", tr.length) + `<div class="karte liste-karte"><ul class="liste">${tr.map((t) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(t.richtung)} ${esc(t.name || t.symbol)}</div><div class="meta">${datumKurz(t.datum)}${t.menge ? " · " + nf0.format(t.menge) + " Stk." : ""}</div></div><div class="r" data-privat>${chf(Math.abs(+t.betrag_chf || 0))}</div></div></li>`).join("")}</ul></div>`;
  return h;
}
function chartsDepot() { linie("c-depot", { punkte: (S.d?.depotverlauf || []).map((p) => ({ x: p.datum, y: +p.wert_chf })), aria: "Depotwert im Zeitverlauf" }); }

// ---------------------------------------------------------------- Uni
function uniDaten() {
  const d = S.d || {}, kurse = d.kurse || [];
  const ects = kurse.filter((k) => k.ects != null);
  const bestanden = ects.filter((k) => k.status === "bestanden").reduce((s, k) => s + +k.ects, 0);
  const laufend = ects.filter((k) => ["laufend", "angemeldet"].includes(k.status)).reduce((s, k) => s + +k.ects, 0);
  const noten = kurse.filter((k) => k.note != null && k.ects);
  const schnitt = noten.reduce((s, k) => s + k.note * k.ects, 0) / Math.max(1, noten.reduce((s, k) => s + +k.ects, 0));
  const pruef = kurse.filter((k) => k.pruefung && new Date(k.pruefung) >= heute()).sort((a, b) => new Date(a.pruefung) - new Date(b.pruefung));
  // Abgaben ohne Doppel (Notion und Canvas melden dieselbe Abgabe)
  const roh = (d.abgaben || []).filter((a) => !["abgegeben", "bestanden"].includes(a.status)), abg = [];
  roh.forEach((a) => {
    const k = (a.kurs || a.titel || "").split(/[\s.]+/)[0].toLowerCase() + "|" + (a.frist ? isoTag(a.frist) : "");
    const da = abg.find((x) => x._k === k);
    if (!da) abg.push({ ...a, _k: k });
    else { if (/upload|report here|abgabe/i.test(da.titel) && !/upload|report here/i.test(a.titel)) da.titel = a.titel; if (!da.link && a.link) da.link = a.link; if (a.link && /canvas/i.test(a.link)) da.frist = a.frist; }
  });
  abg.forEach((a) => { if (/^upload your report here$/i.test(a.titel)) a.titel = "Abgabe " + (a.kurs || "").split(".")[0]; });
  const ma = d.ma || [];
  const maAbgabe = (d.meilensteine || []).find((m) => /masterarbeit/i.test(m.titel) && /abgeb|abgabe/i.test(m.titel) && m.datum);
  return { kurse, bestanden, laufend, schnitt, noten, pruef, abg, ma, maAbgabe };
}
function seiteUni() {
  const u = uniDaten(), ziel = 90;
  const bar = `<div class="ects"><i style="width:${Math.min(100, (u.bestanden / ziel) * 100)}%"></i><b style="width:${Math.min(100 - (u.bestanden / ziel) * 100, (u.laufend / ziel) * 100)}%"></b><span class="ziel" style="left:${Math.min(100, (ziel / Math.max(ziel, u.bestanden + u.laufend)) * 100)}%"></span></div>`;
  let h = hero({ label: "ECTS bestanden", wert: `${nf0.format(u.bestanden)}<small> / ${ziel}</small>`, sub: `+ ${nf0.format(u.laufend)} laufend = ${nf0.format(u.bestanden + u.laufend)}${u.bestanden + u.laufend >= ziel ? " ✓ reicht" : ` · es fehlen ${ziel - u.bestanden - u.laufend}`}`, chart: bar });
  h += zeileKpi([
    { name: "Notenschnitt", wert: u.noten.length ? u.schnitt.toFixed(2).replace(".", ",") : "–", sub: `ECTS-gewichtet · ${u.noten.length} Kurse` },
    { name: "Nächste Prüfung", wert: u.pruef[0] ? datumKurz(u.pruef[0].pruefung) : "–", sub: u.pruef[0] ? `in ${tageBis(u.pruef[0].pruefung)} T · ${esc(u.pruef[0].titel.length > 18 ? u.pruef[0].titel.slice(0, 17) + "…" : u.pruef[0].titel)}` : "" },
    { name: "Masterarbeit", wert: u.maAbgabe ? `${tageBis(u.maAbgabe.datum)} T` : "–", sub: u.maAbgabe ? `Abgabe ${datumKurz(u.maAbgabe.datum)} ${new Date(u.maAbgabe.datum).getFullYear()}` : "" },
  ]);
  h += einschaetzungKarte("uni");
  h += sek("Fristen bis zur Abgabe") + `<div class="karte"><div class="chart" id="c-fristen"></div></div>`;
  const in14 = plusTage(15);
  const liste = [
    ...u.abg.map((a) => ({ t: a.frist, titel: a.titel, sub: a.kurs !== a.titel ? (a.kurs || "").split("(")[0] : "", link: a.link, art: "Abgabe" })),
    ...u.pruef.map((k) => ({ t: k.pruefung, titel: "Prüfung " + k.titel, sub: k.pruefungsart || "", art: "Prüfung" })),
    ...u.ma.filter((m) => m.status !== "erledigt").map((m) => ({ t: m.frist, titel: m.titel.replace(/^Frist:\s*MA-Meilenstein:\s*/, "MA: ").replace(/\s*\((Mo|Di|Mi|Do|Fr|Sa|So) [^)]*\)\s*$/, ""), art: "Masterarbeit" })),
    ...(S.d?.termine || []).filter((t) => terminArt(t) === "uni" && !istBlock(t)).map((t) => ({ t: t.start, titel: terminTitel(t.titel), sub: t.ort || "", art: "Termin" })),
  ].filter((x) => x.t && new Date(x.t) >= (x.art === "Termin" ? new Date() : heute())).sort((a, b) => new Date(a.t) - new Date(b.t));
  const nah = liste.filter((x) => new Date(x.t) < in14), spaeter = liste.filter((x) => new Date(x.t) >= in14);
  const zeile = (x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(x.titel)}</div><div class="meta">${esc(x.art)}${x.sub ? " · " + esc(x.sub) : ""}${x.link ? ` · <a href="${esc(x.link)}" target="_blank" rel="noopener">Canvas</a>` : ""}</div></div>
    <div class="r"><span class="chip ${new Date(x.t) < plusTage(7) ? "gelb" : "blau"}">${fristText(x.t, true)}</span></div></div></li>`;
  h += sek("Nächste 14 Tage", nah.length) + `<div class="karte liste-karte"><ul class="liste">${nah.map(zeile).join("") || '<li class="leer">Nichts in den nächsten 14 Tagen.</li>'}</ul>
    ${spaeter.length ? `<details class="details" data-k="uni-spaeter"${offen("uni-spaeter")}><summary>${spaeter.length} danach</summary><ul class="liste">${spaeter.map(zeile).join("")}</ul></details>` : ""}</div>`;
  const aktiv = u.kurse.filter((k) => k.status !== "bestanden"), fertig = u.kurse.filter((k) => k.status === "bestanden");
  const kz = (k) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500">${esc(k.titel)}</div><div class="meta">${esc(k.semester || "")}${k.pruefung ? " · Prüfung " + datumKurz(k.pruefung) : ""}${k.status !== "bestanden" ? ` · <span class="chip ${k.status === "laufend" ? "blau" : ""}">${esc(k.status)}</span>` : ""}</div>
    ${k.notiz ? `<details class="details" data-k="k-${k.id}"${offen("k-" + k.id)}><summary>Notiz</summary>${esc(k.notiz)}</details>` : ""}</div><div class="r">${k.ects ? `<div>${k.ects} ECTS</div>` : ""}${k.note != null ? `<div class="meta">Note ${String(k.note).replace(".", ",")}</div>` : ""}</div></div></li>`;
  h += sek("Kurse", u.kurse.length) + `<div class="karte liste-karte"><ul class="liste">${aktiv.map(kz).join("")}</ul>
    ${fertig.length ? `<details class="details" data-k="uni-fertig"${offen("uni-fertig")}><summary>${fertig.length} bestanden · ${nf0.format(u.bestanden)} ECTS</summary><ul class="liste">${fertig.map(kz).join("")}</ul></details>` : ""}</div>`;
  return h;
}
function chartsUni() {
  const u = uniDaten(), bis = u.maAbgabe ? new Date(u.maAbgabe.datum) : plusTage(90); bis.setDate(bis.getDate() + 5);
  bahnen("c-fristen", { von: plusTage(-2), bis, bahnen: [
    { name: "Prüfungen", farbe: "var(--s8)", punkte: u.pruef.map((k) => ({ t: k.pruefung, titel: "Prüfung " + k.titel })) },
    { name: "Abgaben", farbe: "var(--s2)", punkte: u.abg.filter((a) => a.frist).map((a) => ({ t: a.frist, titel: a.titel })) },
    { name: "Masterarbeit", farbe: "var(--s7)", punkte: [...u.ma.filter((m) => m.frist).map((m) => ({ t: m.frist, titel: m.titel.replace(/^Frist:\s*MA-Meilenstein:\s*/, "") })), ...(u.maAbgabe ? [{ t: u.maAbgabe.datum, titel: "Abgabe Masterarbeit" }] : [])] },
  ] });
}

// ---------------------------------------------------------------- 5 Jahre
const BEREICH_FARBE = { Karriere: "var(--s1)", Finanzen: "var(--s2)", Vorsorge: "var(--s3)", Steuern: "var(--s4)", Wohnen: "var(--s5)", Versicherung: "var(--s6)", Weiterbildung: "var(--s7)", Studium: "var(--s8)", Admin: "var(--text-3)" };
const wartetJob = (m) => /jobwechsel|jobstart/i.test(m.zeitraum || "");
function seitePlan() {
  const ms = (S.d?.meilensteine || []).filter((m) => m.status !== "verworfen");
  const jetzt = ms.filter((m) => m.status === "geplant" && m.jetzt_tun).sort((a, b) => a.prioritaet - b.prioritaet || new Date(a.datum || 8e15) - new Date(b.datum || 8e15));
  const in90 = ms.filter((m) => m.status !== "erledigt" && m.datum && tageBis(m.datum) <= 90 && tageBis(m.datum) >= -30).length;
  let h = hero({ label: "Nächste 5 Jahre", wert: nf0.format(ms.filter((m) => m.status !== "erledigt").length), sub: `Meilensteine · ${in90} in 90 Tagen · ${jetzt.length} jetzt anstossen`, chart: `<div class="chart" id="c-jahre"></div>` });
  h += einschaetzungKarte("langfrist");
  const zeigen = S.alleMs ? jetzt : jetzt.slice(0, 3);
  h += sek("Jetzt anstossen", jetzt.length) + `<div class="karte liste-karte"><ul class="liste">${zeigen.map((m) => `<li data-ms="${m.id}"><div class="titel">${esc(m.titel)}</div><div class="meta"><span class="chip" style="color:${BEREICH_FARBE[m.bereich] || "inherit"}">${esc(m.bereich)}</span>${m.zeitraum ? esc(m.zeitraum) : m.datum ? datumKurz(m.datum) + " " + new Date(m.datum).getFullYear() : ""}</div>
    <div class="details">${esc(m.jetzt_tun)}</div>${m.warum ? `<details class="details" data-k="ms-${m.id}"${offen("ms-" + m.id)}><summary>Warum</summary>${esc(m.warum)}</details>` : ""}
    <div class="knoepfe-zeile"><button class="knopf gut" data-ms-akt="angestossen">${IC.ok}Angestossen</button><button class="knopf weg" data-ms-akt="verworfen">${IC.weg}Nicht relevant</button></div></li>`).join("") || '<li class="leer">Nichts dringend.</li>'}</ul>
    ${jetzt.length > 3 ? `<button class="knopf mehrzeigen" id="alle-ms">${S.alleMs ? "Weniger" : `+${jetzt.length - 3} weitere`}</button>` : ""}</div>`;
  const jahre = {};
  ms.forEach((m) => { const j = m.datum ? new Date(m.datum).getFullYear() : (m.zeitraum?.match(/20\d\d/)?.[0] || "offen"); (jahre[j] ||= []).push(m); });
  h += sek("Zeitstrahl") + `<div class="karte"><div class="zeitstrahl">${Object.keys(jahre).sort().map((j) => `<div class="jahr">${j}</div>${jahre[j].sort((a, b) => new Date(a.datum || 8e15) - new Date(b.datum || 8e15)).map((m) => `<div class="ms ${m.status === "erledigt" ? "erledigt" : ""} ${wartetJob(m) ? "hohl" : ""}" style="--c:${BEREICH_FARBE[m.bereich] || "var(--accent)"}"><div class="titel" style="font-weight:500">${esc(m.titel)}</div><div class="meta"><span class="chip">${esc(m.bereich)}</span>${wartetJob(m) ? "wartet auf Jobstart" : m.zeitraum ? esc(m.zeitraum) : m.datum ? datumKurz(m.datum) : ""}${m.status !== "geplant" ? ` · ${esc(m.status)}` : ""}</div></div>`).join("")}`).join("") || '<div class="leer">Noch leer.</div>'}</div>
    <div class="legende" style="margin-top:12px">${Object.entries(BEREICH_FARBE).filter(([b]) => ms.some((m) => m.bereich === b)).map(([b, f]) => `<span style="--c:${f}">${b}</span>`).join("")}</div></div>`;
  return h;
}
function chartsPlan() {
  const el = document.getElementById("c-jahre"); if (!el) return;
  const ms = (S.d?.meilensteine || []).filter((m) => m.status !== "verworfen");
  const j0 = new Date().getFullYear(), j1 = j0 + 5, W = Math.max(300, el.clientWidth || 340), H = 64, L = 6, R = 6;
  const X = (t) => L + ((t - +new Date(j0, 0, 1)) / (+new Date(j1, 0, 1) - +new Date(j0, 0, 1))) * (W - L - R);
  let s = `<line class="grid" x1="${L}" x2="${W - R}" y1="34" y2="34"/>`;
  for (let j = j0; j <= j1; j++) s += `<line class="grid" x1="${X(+new Date(j, 0, 1))}" x2="${X(+new Date(j, 0, 1))}" y1="26" y2="42"/><text class="ax" x="${X(+new Date(j, 0, 1)) + (j === j1 ? -2 : 2)}" y="58" text-anchor="${j === j1 ? "end" : "start"}">${j}</text>`;
  const belegt = {};
  ms.forEach((m) => {
    const t = m.datum ? +new Date(m.datum) : (m.zeitraum?.match(/20\d\d/) ? +new Date(+m.zeitraum.match(/20\d\d/)[0], 6, 1) : null);
    if (t == null || t > +new Date(j1, 0, 1)) return;
    const x = Math.round(X(Math.max(t, +new Date(j0, 0, 1))) / 9) * 9, stufe = (belegt[x] = (belegt[x] || 0) + 1) - 1;
    s += `<circle cx="${x}" cy="${34 - stufe * 9}" r="4" fill="${wartetJob(m) ? "var(--surface)" : BEREICH_FARBE[m.bereich] || "var(--accent)"}" stroke="${BEREICH_FARBE[m.bereich] || "var(--accent)"}" stroke-width="1.6" opacity="${m.status === "erledigt" ? ".4" : "1"}" data-tip="${esc(`${m.titel} · ${m.datum ? datumKurz(m.datum) + " " + new Date(m.datum).getFullYear() : m.zeitraum || ""}`)}"/>`;
  });
  const h0 = X(+heute()); s += `<line x1="${h0}" x2="${h0}" y1="6" y2="42" stroke="var(--crit)" stroke-width="1.2"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Meilensteine der nächsten fünf Jahre">${s}</svg>`; tipAn(el);
}

// ---------------------------------------------------------------- Rahmen
function kopf(titel) {
  const sync = S.d?.sync || [], ds = datenStand();
  const alt = (q, std) => { const x = sync.find((s) => s.quelle === q); return !x ? "fehler" : !x.ok ? "fehler" : (Date.now() - new Date(x.zuletzt)) / 36e5 > std ? "alt" : ""; };
  const z = [alt("speicher", 1)];
  if (S.tab === "geld") z.push(ds.saldo && tageSeit(ds.saldo) > 7 ? "alt" : "");
  if (S.tab === "depot") z.push(ds.depot && tageSeit(ds.depot) > 4 ? "alt" : "");
  const schlecht = z.includes("fehler") ? "fehler" : z.includes("alt") ? "alt" : "";
  let unter = `${S.offline ? "offline · " : ""}Stand ${S.geladen ? alter(S.geladen) : "–"}`;
  if (S.tab === "heute" && !S.sp) { const hz = heuteZahlen(); unter = `${hz.faellig ? `${hz.faellig} fällig${hz.minuten ? ` · ${hz.minuten} Min.` : ""}` : "nichts fällig"} · ${S.offline ? "offline" : alter(S.geladen)}`; }
  return `<header class="kopf"><div><h1>${titel}</h1><div class="unter"><span class="punkt ${schlecht}" id="b-sync" role="button" aria-label="Datenstand"></span> ${unter}</div></div>
    <div class="rechts"><button class="rund" id="b-speicher" aria-label="Speicher: alle Seiten und Datenbanken">${IC.buch}</button><button class="rund" id="b-neu" aria-label="Neu laden">${IC.neu}</button></div></header>`;
}
function syncBlatt() {
  const sync = S.d?.sync || [], ds = datenStand();
  blatt(`<h3>Datenstand</h3><div class="meta" style="margin-bottom:8px">${standChip(ds.saldo, 7, "Saldo")}${standChip(ds.buchungen, 35, "Buchungen")}${standChip(ds.depot, 4, "Saxo")}</div>
    <ul class="liste">${sync.sort((a, b) => a.quelle.localeCompare(b.quelle)).map((x) => `<li><div class="reihe"><div class="l"><div class="titel" style="font-weight:500"><span class="punkt ${x.ok ? "" : "fehler"}"></span> ${esc(x.quelle)}</div><div class="meta">${esc(x.meldung || "")}</div></div><div class="r meta">${alter(x.zuletzt)}</div></div></li>`).join("")}</ul>
    <div class="hinweis">Lange auf eine Zahl drücken blendet alle Beträge aus (Privatsphäre).</div>`);
}
function render() {
  const app = $("#app");
  if (!S.d) { app.innerHTML = `<div class="login"><div class="box"><p>Lade …</p></div></div>`; return; }
  const [key, name] = TABS.find((t) => t[0] === S.tab) || TABS[0];
  const titel = { heute: `${TAGE[new Date().getDay()]} ${new Date().getDate()}. ${MONATE[new Date().getMonth()]}`, jobs: "Jobs", geld: "Geld", depot: "Depot", uni: "Uni", plan: "5 Jahre" }[key] || name;
  const sp = !!S.sp;
  const seite = sp ? seiteSpeicher() : { heute: seiteHeute, jobs: seiteJobs, geld: seiteGeld, depot: seiteDepot, uni: seiteUni, plan: seitePlan }[key]();
  const y = window.scrollY;
  app.innerHTML = `${kopf(sp ? "Speicher" : titel)}<main class="tab-${key}">${seite}</main>
    <button class="plus" id="b-plus" aria-label="Neu">${IC.plus}</button>
    <nav class="tabs" role="tablist">${TABS.map(([k, n]) => `<button role="tab" aria-selected="${k === key && !sp}" class="${k === key && !sp ? "an" : ""}" data-tab="${k}">${IC[k]}<span>${n}</span></button>`).join("")}</nav>`;
  const rk = sp ? "sp:" + S.sp.art + (S.sp.id || "") : key;
  if (render.letzterTab === rk) window.scrollTo(0, y); render.letzterTab = rk;
  if (!sp) ({ jobs: chartsJobs, geld: chartsGeld, depot: chartsDepot, uni: chartsUni, plan: chartsPlan }[key] || (() => {}))();
  binden();
}
function binden() {
  $$("nav.tabs button").forEach((b) => b.onclick = () => {
    const los = () => { S.tab = b.dataset.tab; speicher.set("cockpit-tab", S.tab); S.mehr = false; if (S.sp) { S.sp = null; history.replaceState(null, "", location.pathname + location.search); } window.scrollTo(0, 0); render(); };
    document.startViewTransition ? document.startViewTransition(los) : los();
  });
  const bs = $("#b-speicher"); if (bs) bs.onclick = () => { location.hash = "#s/"; };
  spBinden();
  $("#b-neu").onclick = () => { $("#b-sync")?.classList.add("puls"); toast("Lade neu …", [], 1200); laden(); };
  $("#b-sync").onclick = syncBlatt;
  $("#b-plus").onclick = neuBlatt;
  const f = $("#b-filter2"); if (f) f.onclick = ignorierBlatt;
  const m = $("#mehr"); if (m) m.onclick = () => { S.mehr = !S.mehr; render(); };
  const bl = $("#alle-bew"); if (bl) bl.onclick = () => { S.alleBew = !S.alleBew; render(); };
  const am = $("#alle-ms"); if (am) am.onclick = () => { S.alleMs = !S.alleMs; render(); };
  $$("[data-dim]").forEach((b) => b.onclick = () => { S.jobDim = b.dataset.dim; render(); });
  $$(".aufgabe .haken[data-akt]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); const li = b.closest(".aufgabe"); li.classList.add("weg"); setTimeout(() => aufgabeAktion(li.dataset.id, "erledigt"), 160); });
  $$(".aufgabe").forEach(wischen);
  $$("[data-oeffne]").forEach((x) => x.onclick = () => aufgabeBlatt(x.dataset.oeffne));
  $$(".entscheid [data-antwort]").forEach((b) => b.onclick = () => { const k = b.closest(".entscheid"); entscheidAntwort(k.dataset.id, b.dataset.antwort, $(".kommentar", k)?.value.trim() || null); });
  $$("[data-ms-akt]").forEach((b) => b.onclick = () => meilenstein(b.closest("[data-ms]").dataset.ms, b.dataset.msAkt));
  $$("[data-privat]").forEach((x) => {
    let t; x.addEventListener("pointerdown", () => { t = setTimeout(() => { const an = !document.body.classList.contains("privat"); document.body.classList.toggle("privat", an); speicher.set("cockpit-privat", an); toast(an ? "Beträge ausgeblendet." : "Beträge sichtbar."); }, 600); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => x.addEventListener(ev, () => clearTimeout(t)));
  });
}
document.body.classList.toggle("privat", !!speicher.get("cockpit-privat", false));
let letzteY = 0;
window.addEventListener("scroll", () => { const y = window.scrollY, p = $("#b-plus"); if (p) p.classList.toggle("versteckt", y > letzteY + 4 && y > 200); if (Math.abs(y - letzteY) > 4) letzteY = y; }, { passive: true });

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
async function entscheidAntwort(id, antwort, kommentar = null) {
  const f = (S.d.entscheide || []).find((x) => x.id === id); if (!f) return;
  f.antwort = antwort; render();
  const r = await schreiben((q) => q.from("freigaben").update(kommentar ? { antwort, kommentar } : { antwort }).eq("id", id));
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
function loginSeite(fehler = "", modus = "") {
  const email = speicher.get("cockpit-email") || "";
  modus = modus || (speicher.get("cockpit-eingerichtet") ? "login" : "einrichten");
  $("#app").innerHTML = `<div class="login"><div class="box"><img class="logo" src="icons/icon-192.png" alt=""><h1>Cockpit</h1>
    ${modus === "login" ? `<p>Anmelden. Auf dem iPhone füllt der Schlüsselbund alles aus.</p>
      <form id="f-login" autocomplete="on"><input type="email" id="email" name="email" autocomplete="username" placeholder="E-Mail" value="${esc(email)}">
      <input type="password" id="pw" name="password" autocomplete="current-password" placeholder="Passwort">
      <button class="knopf primaer" type="submit" id="b-login">Anmelden</button></form>
      <div class="hinweis"><a href="#" id="l-einrichten">Erstmals einrichten oder Passwort neu setzen</a></div>`
    : modus === "einrichten" ? `<p>Einmalig: Einrichtungscode vom Manager eingeben und ein eigenes Passwort wählen. Das iPhone schlägt ein sicheres vor und merkt es sich.</p>
      <form id="f-einr" autocomplete="on"><input type="email" id="email" name="email" autocomplete="username" placeholder="E-Mail (deine Proton-Adresse)" value="${esc(email)}">
      <input id="einr-code" placeholder="Einrichtungscode" autocomplete="off" autocapitalize="characters">
      <input type="password" id="pw" name="new-password" autocomplete="new-password" placeholder="Neues Passwort (mind. 10 Zeichen)">
      <button class="knopf primaer" type="submit" id="b-einr">Einrichten und anmelden</button></form>
      <div class="hinweis"><a href="#" id="l-login">Ich habe schon ein Passwort</a></div>`
    : `<p>Der Code kommt als Push aufs Handy (ntfy).</p>
      <div id="schritt1"><button class="knopf primaer" id="b-code">Code aufs Handy schicken</button></div>
      <div id="schritt2" style="display:none"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······"><button class="knopf primaer" id="b-otp">Anmelden</button></div>
      <div class="hinweis"><a href="#" id="l-login">Mit Passwort anmelden</a></div>`}
    <div class="fehlertext" id="fehler">${esc(fehler)}</div><div class="hinweis">Privat. Du bleibst danach angemeldet.</div></div></div>`;
  const f = (t) => { $("#fehler").textContent = t; };
  const link = (id, m) => { const l = $(id); if (l) l.onclick = (e) => { e.preventDefault(); loginSeite("", m); }; };
  link("#l-einrichten", "einrichten"); link("#l-login", "login"); link("#l-push", "push");
  const anmelden = async (mail, pw) => {
    const { error } = await sb.auth.signInWithPassword({ email: mail, password: pw });
    if (error) { f(error.message.includes("Invalid") ? "E-Mail oder Passwort stimmt nicht." : error.message); return false; }
    speicher.set("cockpit-email", mail); speicher.set("cockpit-eingerichtet", true); start(); return true;
  };
  const fl = $("#f-login");
  if (fl) fl.onsubmit = async (e) => { e.preventDefault(); $("#b-login").disabled = true; if (!(await anmelden($("#email").value.trim(), $("#pw").value))) $("#b-login").disabled = false; };
  const fe = $("#f-einr");
  if (fe) fe.onsubmit = async (e) => {
    e.preventDefault(); f(""); $("#b-einr").disabled = true;
    try {
      const r = await fetch(`${CFG.url}/functions/v1/cockpit/zugang`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.key },
        body: JSON.stringify({ code: $("#einr-code").value.trim(), passwort: $("#pw").value }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.fehler || "Fehler");
      const mail = $("#email").value.trim() || j.email;
      if (mail.toLowerCase() !== String(j.email).toLowerCase()) throw new Error("Diese E-Mail gehört nicht zum Cockpit.");
      await anmelden(j.email, $("#pw").value);
    } catch (err) { f(err.message); $("#b-einr").disabled = false; }
  };
  const bc = $("#b-code");
  if (bc) {
    bc.onclick = async () => {
      bc.disabled = true; f("");
      try {
        const r = await fetch(`${CFG.url}/functions/v1/cockpit/login-code`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.key } });
        const j = await r.json();
        if (!j.ok) throw new Error(j.fehler || "Fehler");
        speicher.set("cockpit-email", j.email);
        $("#schritt1").style.display = "none"; $("#schritt2").style.display = "block"; setTimeout(() => $("#code").focus(), 100);
      } catch (e) { f(e.message); bc.disabled = false; }
    };
    const otp = async () => {
      const code = $("#code").value.replace(/\D/g, ""), email = speicher.get("cockpit-email");
      if (code.length !== 6 || !email) { f("Bitte 6 Ziffern."); return; }
      $("#b-otp").disabled = true;
      let { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) ({ error } = await sb.auth.verifyOtp({ email, token: code, type: "magiclink" }));
      if (error) { f("Code stimmt nicht oder ist abgelaufen."); $("#b-otp").disabled = false; return; }
      start();
    };
    $("#b-otp").onclick = otp;
    $("#code").addEventListener("input", (e) => { if (e.target.value.replace(/\D/g, "").length === 6) otp(); });
  }
}

// ---------------------------------------------------------------- Speicher (V9): alle Seiten und Datenbanken des digitalen Ichs
// Ersetzt Notion als Ansicht. Links aus Routinen und Kern zeigen auf #s/<id> (Seite/Zeile) bzw. #s/q/<id> (Datenbank).
const SPD = { quellen: null, freie: null, zeilen: {}, seiten: {} };
const hexId = (s) => { const h = String(s || "").replace(/[^0-9a-f]/gi, "").toLowerCase(); return h.length === 32 ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` : null; };
function rtHtml(a) {
  return (a || []).map((t) => {
    let s = esc(t.plain_text ?? t.text?.content ?? "");
    if (!s) return "";
    const an = t.annotations || {};
    if (an.code) s = `<code>${s}</code>`;
    if (an.bold) s = `<b>${s}</b>`;
    if (an.italic) s = `<i>${s}</i>`;
    if (an.strikethrough) s = `<s>${s}</s>`;
    const href = t.href || t.text?.link?.url;
    if (href) s = `<a href="${esc(href)}" target="_blank" rel="noopener">${s}</a>`;
    return s;
  }).join("");
}
function propText(p) {
  if (!p) return "";
  switch (p.type) {
    case "title": case "rich_text": return (p[p.type] || []).map((t) => t.plain_text).join("");
    case "select": case "status": return p[p.type]?.name || "";
    case "multi_select": return (p.multi_select || []).map((x) => x.name).join(", ");
    case "date": return p.date?.start ? (p.date.start.length > 10 ? datumKurz(p.date.start) + " " + p.date.start.slice(11, 16) : datumKurz(p.date.start)) + (p.date.end ? " – " + datumKurz(p.date.end) : "") : "";
    case "number": return p.number ?? "";
    case "checkbox": return p.checkbox ? "ja" : "nein";
    case "url": return p.url || "";
    case "unique_id": return p.unique_id?.number != null ? `${p.unique_id.prefix ? p.unique_id.prefix + "-" : ""}${p.unique_id.number}` : "";
    case "relation": return (p.relation || []).length ? `${p.relation.length} Verknüpfung(en)` : "";
    case "created_time": case "last_edited_time": return p[p.type] ? datumKurz(p[p.type]) : "";
    case "formula": { const f = p.formula || {}; return f[f.type] ?? ""; }
    default: return "";
  }
}
function propHtml(p) {
  if (!p) return "";
  if (p.type === "title" || p.type === "rich_text") return rtHtml(p[p.type]);
  if (p.type === "url" && p.url) return `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.url.replace(/^https?:\/\//, "").slice(0, 60))}</a>`;
  if (p.type === "relation") return (p.relation || []).map((r) => `<a href="#s/${r.id.replace(/-/g, "")}">${esc(SPD.titel?.[r.id] || "Eintrag")}</a>`).join(" · ");
  return esc(propText(p));
}
async function spLaden(art, id) {
  if (TEST) {
    const j = await (await fetch("test-speicher.json?" + Date.now())).json();
    SPD.quellen = j.quellen; SPD.freie = j.freie;
    if (art === "quelle") SPD.zeilen[id] = j.seiten.filter((s) => s.quelle === id);
    if (art === "seite") SPD.seiten[id] = { seite: j.seiten.find((s) => s.id === id) || null, bloecke: j.bloecke.filter((b) => b.seite_id === id) };
    render(); return;
  }
  try {
    if (art === "start") {
      const [q, f] = await Promise.all([
        sb.from("speicher_quellen").select("id, titel, schema, datenbank_id").order("titel"),
        sb.from("speicher_seiten").select("id, titel, parent, icon, geaendert").is("quelle", null).eq("archiviert", false).order("titel"),
      ]);
      SPD.quellen = q.data || []; SPD.freie = f.data || [];
    } else if (art === "quelle") {
      if (!SPD.quellen) await spLaden("start");
      const { data } = await sb.from("speicher_seiten").select("id, titel, properties, geaendert, erstellt").eq("quelle", id).eq("archiviert", false)
        .order("erstellt", { ascending: false }).limit(500);
      SPD.zeilen[id] = data || [];
    } else if (art === "seite") {
      if (!SPD.quellen) await spLaden("start");
      const [s, b] = await Promise.all([
        sb.from("speicher_seiten").select("*").eq("id", id).maybeSingle(),
        sb.from("speicher_bloecke").select("id, parent_id, position, typ, inhalt").eq("seite_id", id).eq("archiviert", false).order("position"),
      ]);
      const rel = Object.values(s.data?.properties || {}).filter((p) => p.type === "relation").flatMap((p) => p.relation.map((r) => r.id));
      if (rel.length) {
        const { data: t } = await sb.from("speicher_seiten").select("id, titel").in("id", rel.slice(0, 100));
        SPD.titel = { ...(SPD.titel || {}), ...Object.fromEntries((t || []).map((x) => [x.id, x.titel])) };
      }
      SPD.seiten[id] = { seite: s.data, bloecke: b.data || [] };
    }
  } catch (e) { toast("Speicher nicht erreichbar: " + e.message); }
  render();
}
function spOeffnen(art, id) {
  S.sp = { art, id };
  if (art === "start" && !SPD.quellen) spLaden("start");
  if (art === "quelle" && !SPD.zeilen[id]) spLaden("quelle", id);
  if (art === "seite") spLaden("seite", id);
  window.scrollTo(0, 0); render();
}
function bloeckeHtml(bloecke, parent) {
  const kinder = bloecke.filter((b) => b.parent_id === parent);
  let h = "", liste = null;
  const zu = () => { if (liste) { h += `</${liste}>`; liste = null; } };
  for (const b of kinder) {
    const x = b.inhalt || {}, t = rtHtml(x.rich_text), sub = bloecke.some((k) => k.parent_id === b.id) && b.typ !== "table" ? bloeckeHtml(bloecke, b.id) : "";
    const art = b.typ === "bulleted_list_item" ? "ul" : b.typ === "numbered_list_item" ? "ol" : null;
    if (art !== liste) { zu(); if (art) { h += `<${art}>`; liste = art; } }
    switch (b.typ) {
      case "heading_1": h += `<h2>${t}</h2>${sub}`; break;
      case "heading_2": h += `<h3>${t}</h3>${sub}`; break;
      case "heading_3": h += `<h4>${t}</h4>${sub}`; break;
      case "bulleted_list_item": case "numbered_list_item": h += `<li>${t}${sub}</li>`; break;
      case "to_do": h += `<div class="sp-todo">${x.checked ? "☑" : "☐"} ${t}</div>${sub}`; break;
      case "quote": case "callout": h += `<blockquote>${x.icon?.emoji ? esc(x.icon.emoji) + " " : ""}${t}${sub}</blockquote>`; break;
      case "code": h += `<pre>${esc((x.rich_text || []).map((r) => r.plain_text).join(""))}</pre>`; break;
      case "divider": h += "<hr>"; break;
      case "toggle": h += `<details><summary>${t}</summary>${sub}</details>`; break;
      case "child_page": h += `<p><a href="#s/${String(x.seite || b.id).replace(/-/g, "")}">📄 ${esc(x.title || "Seite")}</a></p>`; break;
      case "child_database": {
        const q = (SPD.quellen || []).find((z) => (x.datenbank && z.datenbank_id === x.datenbank) || (x.title && z.titel === x.title));
        h += `<p>${q ? `<a href="#s/q/${q.id.replace(/-/g, "")}">🗂️ ${esc(q.titel)}</a>` : `<span class="muted">🗂️ ${esc(x.title || "Datenbank-Ansicht (siehe Datenbanken)")}</span>`}</p>`; break;
      }
      case "table": {
        const zeilen = bloecke.filter((k) => k.parent_id === b.id);
        h += `<div class="sp-tab"><table>${zeilen.map((z, i) => `<tr>${(z.inhalt?.cells || []).map((c) => i === 0 && x.has_column_header ? `<th>${rtHtml(c)}</th>` : `<td>${rtHtml(c)}</td>`).join("")}</tr>`).join("")}</table></div>`;
        break;
      }
      case "paragraph": h += t ? `<p>${t}</p>${sub}` : sub; break;
      default: if (t) h += `<p>${t}</p>`; h += sub;
    }
  }
  zu();
  return h;
}
function seiteSpeicher() {
  const sp = S.sp;
  const zurueck = `<button class="knopf" id="sp-zurueck" style="margin-bottom:12px">‹ ${sp.art === "start" ? "Zurück zum Cockpit" : "Speicher"}</button>`;
  if (sp.art === "start") {
    if (!SPD.quellen) return zurueck + `<div class="leer">Lade …</div>`;
    const freie = SPD.freie || [];
    const kinderVon = (pid) => freie.filter((f) => f.parent?.page_id === pid);
    const wurzeln = freie.filter((f) => !f.parent?.page_id || !freie.some((x) => x.id === f.parent.page_id));
    const baum = (f, tiefe) => `<li style="padding-left:${tiefe * 14}px"><a href="#s/${f.id.replace(/-/g, "")}">${f.icon?.emoji ? esc(f.icon.emoji) + " " : "📄 "}${esc(f.titel || "(ohne Titel)")}</a><span class="meta"> · ${alter(f.geaendert)}</span></li>` + kinderVon(f.id).map((k) => baum(k, tiefe + 1)).join("");
    return zurueck + `<div class="karte"><h2>Seiten</h2><ul class="liste sp-liste">${wurzeln.map((f) => baum(f, 0)).join("")}</ul></div>
      <div class="karte"><h2>Datenbanken</h2><ul class="liste sp-liste">${SPD.quellen.map((q) => `<li><a href="#s/q/${q.id.replace(/-/g, "")}">🗂️ ${esc(q.titel)}</a></li>`).join("")}</ul></div>
      <div class="hinweis">Einzige Wahrheit seit 13.11.2026 (Supabase, Zürich). Notion ist nur noch Archiv.</div>`;
  }
  if (sp.art === "quelle") {
    const q = (SPD.quellen || []).find((x) => x.id === sp.id);
    const zeilen = SPD.zeilen[sp.id];
    if (!zeilen) return zurueck + `<div class="leer">Lade …</div>`;
    const schema = q?.schema || {};
    const statusP = Object.keys(schema).find((n) => n === "Status") || Object.keys(schema).find((n) => ["status", "select"].includes(schema[n].type));
    const datumP = ["Frist", "Zeit", "Empfangen", "Datum", "Eingereicht am"].find((n) => schema[n]?.type === "date") || Object.keys(schema).find((n) => schema[n].type === "date");
    const such = (S.spSuche || "").toLowerCase();
    const statusWerte = [...new Set(zeilen.map((z) => propText(z.properties?.[statusP])).filter(Boolean))];
    const sf = S.spStatus?.[sp.id] || "";
    const liste = zeilen.filter((z) => (!such || (z.titel || "").toLowerCase().includes(such)) && (!sf || propText(z.properties?.[statusP]) === sf));
    return zurueck + `<div class="karte"><h2>${esc(q?.titel || "Datenbank")} <span class="muted klein">${liste.length}/${zeilen.length}</span></h2>
      <input id="sp-suche" class="sp-suche" placeholder="Suchen …" value="${esc(S.spSuche || "")}">
      ${statusWerte.length > 1 ? `<div class="knoepfe sp-chips"><button class="chip ${!sf ? "an" : ""}" data-sf="">Alle</button>${statusWerte.map((w) => `<button class="chip ${sf === w ? "an" : ""}" data-sf="${esc(w)}">${esc(w)}</button>`).join("")}</div>` : ""}
      <ul class="liste">${liste.slice(0, 300).map((z) => `<li><a class="reihe" href="#s/${z.id.replace(/-/g, "")}"><div class="l"><div class="titel">${esc(z.titel || "(ohne Titel)")}</div><div class="meta">${esc(propText(z.properties?.[statusP]))}${datumP && propText(z.properties?.[datumP]) ? " · " + esc(propText(z.properties[datumP])) : ""}</div></div></a></li>`).join("") || '<li class="leer">Keine Einträge.</li>'}</ul></div>`;
  }
  const d = SPD.seiten[sp.id];
  if (!d) return zurueck + `<div class="leer">Lade …</div>`;
  if (!d.seite) return zurueck + `<div class="leer">Nicht gefunden oder nicht sichtbar.</div>`;
  const s = d.seite, q = (SPD.quellen || []).find((x) => x.id === s.quelle);
  const props = q ? Object.entries(s.properties || {}).filter(([n, p]) => p.type !== "title" && propText(p) !== "" && propText(p) !== "nein") : [];
  return zurueck + `<div class="karte sp-seite"><div class="meta">${q ? `<a href="#s/q/${q.id.replace(/-/g, "")}">${esc(q.titel)}</a>` : "Seite"} · geändert ${alter(s.geaendert)}</div>
    <h2>${s.icon?.emoji ? esc(s.icon.emoji) + " " : ""}${esc(s.titel || "(ohne Titel)")}</h2>
    ${props.length ? `<dl class="sp-props">${props.map(([n, p]) => `<dt>${esc(n)}</dt><dd>${propHtml(p)}</dd>`).join("")}</dl>` : ""}
    <div class="sp-inhalt">${bloeckeHtml(d.bloecke, s.id) || (props.length ? "" : '<div class="leer">Kein Inhalt.</div>')}</div></div>`;
}
function spBinden() {
  const z = $("#sp-zurueck");
  if (z) z.onclick = () => { if (S.sp.art === "start") { S.sp = null; history.replaceState(null, "", location.pathname + location.search); render(); } else history.length > 1 && location.hash.startsWith("#s/") ? history.back() : (location.hash = "#s/"); };
  const s = $("#sp-suche");
  if (s) s.oninput = () => { S.spSuche = s.value; clearTimeout(spBinden.t); spBinden.t = setTimeout(() => { render(); const n = $("#sp-suche"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
  $$("[data-sf]").forEach((b) => b.onclick = () => { S.spStatus = { ...(S.spStatus || {}), [S.sp.id]: b.dataset.sf }; render(); });
}
async function spRoute() {
  const h = location.hash;
  if (!h.startsWith("#s/")) { if (S.sp) { S.sp = null; render(); } return; }
  const rest = h.slice(3);
  if (!rest) return spOeffnen("start");
  const istQ = rest.startsWith("q/"), roh = (istQ ? rest.slice(2) : rest).split("?")[0];
  const id = hexId(roh); if (!id) return;
  // Alte Notion-Links zeigen oft auf die Datenbank-ID statt auf die Datenquelle: beide auflösen.
  if (!SPD.quellen) await spLaden("start");
  const q = (SPD.quellen || []).find((x) => x.id === id || x.datenbank_id === id);
  if (q || istQ) { S.spSuche = ""; return spOeffnen("quelle", q ? q.id : id); }
  spOeffnen("seite", id);
}
window.addEventListener("hashchange", spRoute);

async function start() {
  render();
  await laden();
  spRoute();
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
