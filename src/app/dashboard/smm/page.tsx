"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Clock, ExternalLink, Hourglass, RefreshCw, Rocket, Search, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

type Service = { provider: string; providerLabel: string; service: number; name: string; type: string; category: string; rate: number; min: number; max: number; refill: boolean; cancel: boolean; pricePer1000Xaf: number; platform: string };
type Order = { id: string; serviceName: string; category: string; link: string; quantity: number; priceXaf: number; providerOrderId: string | null; status: string; startCount: number | null; remains: number | null; createdAt: string; extra: { platform?: string; refill?: unknown; error?: string } };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700" },
  in_progress: { label: "En cours", cls: "bg-sky-50 text-sky-700" },
  processing: { label: "Traitement", cls: "bg-sky-50 text-sky-700" },
  partial: { label: "Partiel", cls: "bg-purple-50 text-purple-700" },
  completed: { label: "Terminé", cls: "bg-emerald-50 text-emerald-700" },
  canceled: { label: "Annulé", cls: "bg-gray-100 text-gray-600" },
  failed: { label: "Échoué · remboursé", cls: "bg-red-50 text-red-700" },
};

const PLATFORM_EMOJI: Record<string, string> = { Instagram: "📸", TikTok: "🎵", Facebook: "📘", YouTube: "▶️", WhatsApp: "💬", Telegram: "✈️", Twitter: "🐦", Spotify: "🎧", LinkedIn: "💼", Snapchat: "👻", Threads: "🧵", Twitch: "🎮", Discord: "🎧", Pinterest: "📌", Website: "🌐", Autres: "✨" };

export default function SmmPage() {
  const { user, refresh } = useAppUser();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [catError, setCatError] = useState<string | null>(null);
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [serviceKey, setServiceKey] = useState<string | null>(null); // `${provider}:${service}`
  const [providers, setProviders] = useState<{ id: string; label: string }[]>([]);
  const [providerFilter, setProviderFilter] = useState("all");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadOrders = useCallback(async () => {
    setSyncing(true);
    const r = await fetch("/api/smm/orders", { cache: "no-store" });
    if (r.ok) setOrders((await r.json()).items);
    setSyncing(false);
  }, []);

  useEffect(() => {
    fetch("/api/smm/services")
      .then((r) => r.json())
      .then((d) => {
        setEnabled(Boolean(d.enabled));
        setServices(d.services || []);
        setPlatforms(d.platforms || []);
        setProviders(d.providers || []);
        setPlatform(d.platforms?.[0] || "");
        if (d.error) setCatError(d.error);
      })
      .catch(() => setEnabled(false));
    loadOrders();
  }, [loadOrders]);

  const categories = useMemo(() => [...new Set(services.filter((s) => s.platform === platform).map((s) => s.category))].sort(), [services, platform]);
  useEffect(() => { setCategory(categories[0] || ""); }, [categories]);
  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return services.filter((s) => s.platform === platform && (providerFilter === "all" || s.provider === providerFilter) && (!category || s.category === category) && (!qq || s.name.toLowerCase().includes(qq) || String(s.service).includes(qq)));
  }, [services, platform, category, q, providerFilter]);
  const keyOf = (s: Service) => `${s.provider}:${s.service}`;
  useEffect(() => { if (!filtered.some((s) => keyOf(s) === serviceKey)) setServiceKey(filtered[0] ? keyOf(filtered[0]) : null); }, [filtered, serviceKey]);

  const service = services.find((s) => keyOf(s) === serviceKey) || null;
  const qty = Number(quantity) || 0;
  const price = service && qty ? Math.max(100, Math.ceil((service.pricePer1000Xaf * qty) / 1000)) : 0;
  const needsComments = service ? /comment/i.test(service.type) && /custom/i.test(service.type) : false;

  async function order() {
    if (!service) return;
    setMsg(null);
    setBusy(true);
    const r = await fetch("/api/smm/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: service.provider, serviceId: service.service, link, quantity: qty, comments: needsComments ? comments : undefined }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error || "Commande impossible." });
    setMsg({ ok: true, text: `Commande #${d.order.providerOrderId} envoyée. Suivez sa progression ci-dessous.` });
    setLink("");
    setQuantity("");
    setComments("");
    await Promise.all([refresh(), loadOrders()]);
  }

  /* ---------- Bientôt ---------- */
  if (enabled === false) {
    return (
      <>
        <Link href="/dashboard" className="flex items-center gap-3 text-[20px] text-gray-600"><ArrowLeft className="h-6 w-6" /> Retour</Link>
        <section className="relative mt-5 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1538e8] to-[#0a1fb3] px-8 py-9 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10" />
          <span className="relative inline-flex h-12 items-center gap-2 rounded-2xl bg-[#f8b61a] px-5 text-[15px] font-extrabold tracking-wide text-[#111a2e]"><Hourglass className="h-5 w-5" /> BIENTÔT</span>
          <h1 className="relative mt-5 text-[36px] font-extrabold leading-tight">Services SMM</h1>
          <p className="relative mt-4 text-[21px] leading-snug text-white/90">Abonnés, likes, vues et commentaires pour Instagram, TikTok, Facebook, YouTube, WhatsApp, Telegram et plus — directement depuis votre solde DBI.</p>
        </section>
        <section className="card mt-6 flex flex-col items-center px-8 py-14 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-primary"><Rocket className="h-12 w-12" /></span>
          <p className="mt-6 text-[26px] font-bold text-ink">Bientôt disponible</p>
          <p className="mt-2 max-w-sm text-[18px] text-gray-500">Le service SMM est en cours d&apos;activation. Vous serez informé dans la communauté dès son ouverture.</p>
          <Link href="/dashboard/depot" className="btn-primary mt-8 !w-auto px-10">Préparer mon solde</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1538e8] to-[#0a1fb3] px-8 py-9 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-5">
          <Link href="/dashboard" aria-label="Retour" className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#c6f135] text-[#0a1fb3]"><ArrowLeft className="h-8 w-8" strokeWidth={2.5} /></Link>
          <h1 className="text-[34px] font-extrabold leading-tight">Services SMM</h1>
        </div>
        <span className="relative mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/15 px-5 text-[15px] font-extrabold tracking-wide"><Sparkles className="h-5 w-5" /> BOOST RÉSEAUX SOCIAUX</span>
        <p className="relative mt-5 text-[21px] leading-snug text-white/90">Abonnés, likes, vues et commentaires. Payé avec votre solde principal, livraison automatique.</p>
        <div className="relative mt-6 inline-flex items-center gap-4 rounded-2xl bg-white/15 px-6 py-4"><Wallet className="h-9 w-9" /><div><p className="text-[14px] font-extrabold uppercase tracking-wide text-white/80">Solde</p><p className="text-[26px] font-extrabold leading-tight">{fmt(user.balance)} FCFA</p></div></div>
      </section>

      {enabled === null && <p className="mt-6 text-center text-[18px] text-gray-500">Chargement du catalogue…</p>}
      {catError && <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-[16px] font-medium text-amber-800">{catError}</p>}

      {services.length > 0 && (
        <>
          {/* Platforms */}
          <div className="-mx-6 mt-6 flex gap-3 overflow-x-auto px-6 pb-2">
            {platforms.map((p) => (
              <button key={p} type="button" onClick={() => setPlatform(p)} className={"flex h-14 shrink-0 items-center gap-2 rounded-full border px-5 text-[17px] font-semibold " + (platform === p ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-ink")}>
                <span>{PLATFORM_EMOJI[p] ?? "✨"}</span>{p}
              </button>
            ))}
          </div>

          <section className="card mt-5 px-7 py-7">
            <h2 className="text-[26px] font-bold text-ink">Nouvelle commande</h2>
            {providers.length > 1 && (
              <>
                <label className="label mt-5 text-[18px]">Fournisseur</label>
                <div className="flex flex-wrap gap-2">
                  {[{ id: "all", label: "Tous" }, ...providers].map((p) => (
                    <button key={p.id} type="button" onClick={() => setProviderFilter(p.id)} className={"rounded-full border px-4 py-2 text-[15px] font-semibold " + (providerFilter === p.id ? "border-primary bg-primary-soft text-primary" : "border-gray-200 bg-white text-gray-700")}>{p.label}</button>
                  ))}
                </div>
              </>
            )}
            <label className="label mt-5 text-[18px]">Catégorie</label>
            <Sel value={category} onChange={setCategory}>{categories.map((c) => <option key={c}>{c}</option>)}</Sel>
            <label className="label mt-5 text-[18px]">Service</label>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input className="input !h-14 pl-12 text-[16px]" placeholder="Rechercher un service ou un ID" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Sel value={serviceKey ?? ""} onChange={(v) => setServiceKey(v)}>
              {filtered.map((s) => <option key={keyOf(s)} value={keyOf(s)}>#{s.service} · {s.name} — {fmt(s.pricePer1000Xaf)} F / 1000{providers.length > 1 ? ` · ${s.providerLabel}` : ""}</option>)}
            </Sel>
            {service && (
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <Mini label="Prix / 1000" value={`${fmt(service.pricePer1000Xaf)} F`} />
                <Mini label="Min" value={fmt(service.min)} />
                <Mini label="Max" value={fmt(service.max)} />
              </div>
            )}
            {service && <p className="mt-3 text-[15px] text-gray-500">{service.providerLabel} · {service.type}{service.refill ? " · Refill ♻️" : ""}{service.cancel ? " · Annulable" : ""}</p>}

            <label className="label mt-5 text-[18px]">Lien</label>
            <input className="input text-[18px]" type="url" placeholder="https://instagram.com/votrecompte" value={link} onChange={(e) => setLink(e.target.value)} />
            <label className="label mt-5 text-[18px]">Quantité</label>
            <input className="input text-[18px]" inputMode="numeric" placeholder={service ? `${service.min} – ${service.max}` : "100"} value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
            {needsComments && (
              <>
                <label className="label mt-5 text-[18px]">Commentaires (un par ligne)</label>
                <textarea className="input !h-32 py-3 text-[17px]" value={comments} onChange={(e) => setComments(e.target.value)} />
              </>
            )}

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary-soft px-6 py-5">
              <span className="text-[18px] font-semibold text-ink">Total à payer</span>
              <span className="text-[26px] font-extrabold text-primary">{fmt(price)} FCFA</span>
            </div>
            {msg && <p className={"mt-4 rounded-2xl px-4 py-3 text-[16px] font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p>}
            <button type="button" onClick={order} disabled={busy || !service || !link || qty <= 0} className="btn-primary mt-5">{busy ? <span className="spinner" /> : <><TrendingUp className="h-6 w-6" /> Commander</>}</button>
          </section>
        </>
      )}

      {/* Orders */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[28px] font-extrabold text-ink">Mes commandes</h2>
        <button type="button" onClick={loadOrders} disabled={syncing} className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[15px] font-semibold text-ink"><RefreshCw className={"h-4 w-4 " + (syncing ? "animate-spin" : "")} /> Actualiser</button>
      </div>
      <div className="mt-4 space-y-3">
        {orders.length === 0 && <p className="card px-6 py-10 text-center text-[17px] text-gray-500">Aucune commande pour le moment.</p>}
        {orders.map((o) => {
          const st = STATUS[o.status] ?? STATUS.pending;
          const delivered = o.remains !== null ? Math.max(0, o.quantity - o.remains) : null;
          return (
            <article key={o.id} className="card px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[18px] font-bold text-ink">{o.serviceName}</p><p className="text-[14px] text-gray-500">{o.extra?.platform ?? o.category} · #{o.providerOrderId ?? "—"} · {new Date(o.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p></div>
                <span className={"shrink-0 rounded-lg px-3 py-1 text-[13px] font-bold " + st.cls}>{st.label}</span>
              </div>
              <a href={o.link} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 truncate text-[14px] text-primary"><ExternalLink className="h-4 w-4 shrink-0" />{o.link}</a>
              <div className="mt-3 flex items-center justify-between text-[15px] text-gray-600">
                <span>{fmt(o.quantity)} · {fmt(o.priceXaf)} F</span>
                {delivered !== null && <span>Livré : {fmt(delivered)} / {fmt(o.quantity)}</span>}
                {o.startCount !== null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> départ {fmt(o.startCount)}</span>}
              </div>
              {delivered !== null && <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (delivered / o.quantity) * 100)}%` }} /></div>}
              {o.status === "completed" && !o.extra?.refill && (
                <button type="button" onClick={() => fetch(`/api/smm/orders/${o.id}/refill`, { method: "POST" }).then(loadOrders)} className="mt-3 text-[14px] font-semibold text-primary">Demander un refill</button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-12 text-[17px]" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-surface px-3 py-3"><p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-0.5 text-[16px] font-bold text-ink">{value}</p></div>;
}
