"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Megaphone, Sparkles, Target, Upload, Video, Wallet, X } from "lucide-react";
import { SIGNUP_COUNTRIES } from "@/lib/countries";
import { useAppUser } from "./AppShell";
import { DIAL_BY_CODE } from "@/lib/countries";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const CURRENCIES = ["XAF", "XOF", "USD", "CDF", "GNF", "NGN", "GHS", "KES", "EUR"];
const INTERESTS = ["Business", "E-commerce", "Formation", "Crypto", "Immobilier", "Mode & Beauté", "Santé", "Technologie", "Emploi", "Voyage", "Alimentation", "Éducation"];
const AGES = Array.from({ length: 120 - 13 + 1 }, (_, i) => 13 + i);

type Sim = { budgetXaf: number; costPerView: number; targetViews: number; days: number; bonusDays: number; totalDays: number; minBudgetXaf: number; minInCurrency: number; ok: boolean; estimatedReach: number };

export default function CampaignModal({ open, onClose, onCreated, config }: { open: boolean; onClose: () => void; onCreated: () => void; config: { minImage: number; minVideo: number; costPerView: number; days: number; bonusDays: number } }) {
  const { user, refresh } = useAppUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ mediaType: "image" as "image" | "video", title: "", mediaUrl: "", description: "", publishText: "", budget: "", currency: user.countryCode === "CM" || user.countryCode === "GA" ? "XAF" : "XOF", whatsapp: "", phone: "", website: "", targetCountries: [] as string[], targetCities: [] as string[], interests: [] as string[], ageMin: 18, ageMax: 120 });
  const [cityInput, setCityInput] = useState("");
  const [sim, setSim] = useState<Sim | null>(null);
  const [step, setStep] = useState<"form" | "review">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!open) { setStep("form"); setSim(null); setError(null); } }, [open]);
  if (!open) return null;

  const dial = DIAL_BY_CODE[user.countryCode] || "+237";
  const minLabel = f.mediaType === "video" ? config.minVideo : config.minImage;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) return setError("Image trop lourde (max 1,5 Mo). Utilisez une image compressée.");
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, mediaUrl: String(r.result) }));
    r.readAsDataURL(file);
  }

  async function simulate() {
    setError(null);
    if (!f.title.trim() || !f.description.trim() || !f.publishText.trim()) return setError("Remplissez le titre, la description et le texte à publier.");
    if (f.mediaType === "image" && !f.mediaUrl) return setError("Ajoutez une image de campagne.");
    if (f.mediaType === "video" && !f.mediaUrl) return setError("Ajoutez le lien de votre vidéo (YouTube, Drive…).");
    const budget = Number(f.budget);
    if (!budget) return setError("Indiquez votre budget.");
    if (f.ageMin > f.ageMax) return setError("L'âge minimum doit être inférieur à l'âge maximum.");
    setBusy(true);
    const r = await fetch("/api/ads/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budget, currency: f.currency, mediaType: f.mediaType }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    setSim(d.simulation);
    if (!d.simulation.ok) return setError(`Budget minimum ${f.mediaType} : ${fmt(d.simulation.minInCurrency)} ${f.currency}.`);
    setStep("review");
  }

  async function publish() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/ads/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, budget: Number(f.budget), whatsapp: f.whatsapp || "", phone: f.phone || "", website: f.website || "" }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    await refresh();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-gray-700/70" onClick={onClose}>
      <div className="mx-auto flex h-[92dvh] w-full max-w-md flex-col rounded-t-[40px] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-10 pb-6 pt-8">
          <div className="flex items-start justify-between">
            <span className="flex h-12 items-center gap-2 rounded-2xl bg-primary-soft px-5 text-[15px] font-extrabold tracking-wide text-primary"><Sparkles className="h-5 w-5" /> NOUVELLE CAMPAGNE</span>
            <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gray-100 text-gray-600"><X className="h-7 w-7" /></button>
          </div>
          <h2 className="mt-4 text-[34px] font-extrabold text-[#0b1a5c]">Créer une campagne</h2>
          <p className="mt-1 text-[19px] text-gray-500">Configurez votre annonce et simulez le budget avant publication.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8">
          {step === "form" ? (
            <>
              <p className="text-[19px] font-bold text-ink">Type de média</p>
              <div className="mt-3 grid grid-cols-2 rounded-2xl bg-gray-100 p-1.5">
                {(["image", "video"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setF({ ...f, mediaType: m, mediaUrl: "" })} className={"flex h-[80px] items-center justify-center gap-3 rounded-xl text-[20px] font-bold " + (f.mediaType === m ? "bg-white text-primary shadow" : "text-gray-500")}>
                    {m === "image" ? <ImageIcon className="h-6 w-6" /> : <Video className="h-6 w-6" />}{m === "image" ? "Image" : "Vidéo"}
                  </button>
                ))}
              </div>

              <Label>Titre de la campagne</Label>
              <input className="input text-[21px]" placeholder="Ex: Promotion formation IA" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />

              <Label>{f.mediaType === "image" ? "Image de campagne" : "Lien de la vidéo"}</Label>
              {f.mediaType === "image" ? (
                <>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[88px] w-full items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-surface px-6 text-[19px] font-semibold text-gray-700">
                    {f.mediaUrl ? <img src={f.mediaUrl} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <Upload className="h-7 w-7 text-primary" />}
                    {f.mediaUrl ? "Changer l'image" : "Ajouter une image"}
                  </button>
                </>
              ) : (
                <input className="input text-[19px]" type="url" placeholder="https://youtube.com/…" value={f.mediaUrl} onChange={(e) => setF({ ...f, mediaUrl: e.target.value })} />
              )}

              <Label>Description</Label>
              <textarea className="input !h-28 py-4 text-[19px]" placeholder="Présentez votre offre..." value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />

              <Label>Texte à publier par les diffuseurs</Label>
              <textarea className="input !h-28 py-4 text-[19px]" placeholder="Rédigez le message exact à publier..." value={f.publishText} onChange={(e) => setF({ ...f, publishText: e.target.value })} />
              <p className="mt-3 text-[18px] text-gray-500">Le lien de tracking sera ajouté automatiquement.</p>

              <div className="mt-8 rounded-3xl border border-gray-200 bg-surface px-8 py-8">
                <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Wallet className="h-7 w-7" /></span><p className="text-[22px] font-bold text-ink">Budget &amp; objectifs</p></div>
                <div className="mt-6 grid grid-cols-[1fr_auto] gap-4">
                  <div><p className="mb-2 text-[21px] text-ink">Budget</p><input className="input bg-white text-[21px]" inputMode="decimal" placeholder="Ex: 10 000" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/[^\d.]/g, "") })} /></div>
                  <div className="w-44"><p className="mb-2 text-[21px] text-ink">Devise</p><select className="input !border-primary bg-white text-[21px]" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                </div>
                <p className="mt-3 text-[19px] text-gray-500">Minimum {f.mediaType} configuré : {fmt(minLabel)} FCFA · {config.costPerView} FCFA / vue vérifiée.</p>
              </div>

              <div className="mt-6 rounded-3xl border border-gray-200 bg-white px-8 py-8">
                <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Megaphone className="h-7 w-7" /></span><p className="text-[22px] font-bold text-ink">Contacts</p></div>
                <p className="mt-6 text-[21px] font-bold text-ink">WhatsApp</p>
                <input className="input mt-2 text-[21px]" type="tel" placeholder={`${dial}650000000`} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value.replace(/[^\d+]/g, "") })} />
                <p className="mt-2 text-[18px] text-gray-500">Exemple : {dial}650000000</p>
                <p className="mt-5 text-[21px] font-bold text-ink">Téléphone</p>
                <input className="input mt-2 text-[21px]" type="tel" placeholder="690000000" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+]/g, "") })} />
                <p className="mt-5 text-[21px] font-bold text-ink">Site web</p>
                <input className="input mt-2 text-[21px]" type="url" placeholder="https://" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
              </div>

              {/* Ciblage */}
              <div className="mt-6 rounded-3xl border border-gray-200 bg-surface px-8 py-8">
                <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Target className="h-7 w-7" /></span><p className="text-[22px] font-bold text-ink">Ciblage</p></div>

                <p className="mt-6 text-[21px] font-bold text-ink">Pays cibles</p>
                <select className="input mt-2 bg-white text-[21px]" value="" onChange={(e) => { const v = e.target.value; if (v && !f.targetCountries.includes(v)) setF({ ...f, targetCountries: [...f.targetCountries, v] }); }}>
                  <option value="">Tous les pays</option>
                  {SIGNUP_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <Chips items={f.targetCountries.map((c) => ({ key: c, label: SIGNUP_COUNTRIES.find((x) => x.code === c)?.name ?? c }))} onRemove={(k) => setF({ ...f, targetCountries: f.targetCountries.filter((x) => x !== k) })} />
                <p className="mt-2 text-[18px] text-gray-500">Laissez vide pour tous les pays.</p>

                <p className="mt-6 text-[21px] font-bold text-ink">Villes cibles</p>
                <input className="input mt-2 bg-white text-[21px]" placeholder="Toutes les villes" value={cityInput} onChange={(e) => setCityInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && cityInput.trim()) { e.preventDefault(); if (!f.targetCities.includes(cityInput.trim())) setF({ ...f, targetCities: [...f.targetCities, cityInput.trim()] }); setCityInput(""); } }} onBlur={() => { if (cityInput.trim() && !f.targetCities.includes(cityInput.trim())) { setF({ ...f, targetCities: [...f.targetCities, cityInput.trim()] }); setCityInput(""); } }} />
                <Chips items={f.targetCities.map((c) => ({ key: c, label: c }))} onRemove={(k) => setF({ ...f, targetCities: f.targetCities.filter((x) => x !== k) })} />
                <p className="mt-2 text-[18px] text-gray-500">Laissez vide pour toutes les villes.</p>

                <p className="mt-6 text-[21px] font-bold text-ink">Interets</p>
                <select className="input mt-2 bg-white text-[21px]" value="" onChange={(e) => { const v = e.target.value; if (v && !f.interests.includes(v)) setF({ ...f, interests: [...f.interests, v] }); }}>
                  <option value="">Tous les interets</option>
                  {INTERESTS.map((i) => <option key={i}>{i}</option>)}
                </select>
                <Chips items={f.interests.map((c) => ({ key: c, label: c }))} onRemove={(k) => setF({ ...f, interests: f.interests.filter((x) => x !== k) })} />
                <p className="mt-2 text-[18px] text-gray-500">Selection multiple possible.</p>

                <p className="mt-6 text-[21px] font-bold text-ink">Age min</p>
                <select className="input mt-2 bg-white text-[21px]" value={f.ageMin} onChange={(e) => setF({ ...f, ageMin: Number(e.target.value) })}>{AGES.map((a) => <option key={a} value={a}>{a}</option>)}</select>
                <p className="mt-6 text-[21px] font-bold text-ink">Age max</p>
                <select className="input mt-2 bg-white text-[21px]" value={f.ageMax} onChange={(e) => setF({ ...f, ageMax: Number(e.target.value) })}>{AGES.map((a) => <option key={a} value={a}>{a}</option>)}</select>
              </div>
            </>
          ) : (
            sim && (
              <>
                <h3 className="text-[28px] font-bold text-ink">Simulation de la campagne</h3>
                <p className="mt-1 text-[19px] text-gray-500">Vérifiez les chiffres avant de publier. Le budget est débité de votre solde principal et la campagne passe en validation DBI.</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Kpi label="Budget" value={`${fmt(Number(f.budget))} ${f.currency}`} sub={`≈ ${fmt(sim.budgetXaf)} FCFA`} />
                  <Kpi label="Coût / vue" value={`${sim.costPerView} FCFA`} />
                  <Kpi label="Vues qualifiées" value={fmt(sim.targetViews)} sub={`Portée estimée ${fmt(sim.estimatedReach)}`} />
                  <Kpi label="Durée" value={`${sim.days} j + ${sim.bonusDays} bonus`} sub={`${sim.totalDays} jours au total`} />
                </div>
                <div className={"mt-6 rounded-2xl px-6 py-5 text-[18px] " + (user.balance >= sim.budgetXaf ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
                  Solde principal : <strong>{fmt(user.balance)} FCFA</strong>{user.balance < sim.budgetXaf && " — insuffisant, effectuez un dépôt."}
                </div>
                {f.mediaUrl && f.mediaType === "image" && <img src={f.mediaUrl} alt="" className="mt-6 max-h-72 w-full rounded-2xl object-cover" />}
                <div className="mt-6 rounded-2xl bg-surface px-6 py-5">
                  <p className="text-[15px] font-bold uppercase tracking-wide text-gray-500">Texte diffuseur</p>
                  <p className="mt-2 whitespace-pre-wrap text-[18px] text-ink">{f.publishText}</p>
                </div>
              </>
            )
          )}
          {error && <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 px-10 py-6">
          <button type="button" onClick={step === "review" ? () => setStep("form") : onClose} className="h-[84px] rounded-2xl bg-gray-100 text-[19px] font-bold text-gray-700">{step === "review" ? "Modifier" : "Annuler"}</button>
          {step === "form" ? (
            <button type="button" onClick={simulate} disabled={busy} className="h-[84px] rounded-2xl bg-primary text-[19px] font-bold text-white disabled:opacity-60">{busy ? <span className="spinner" /> : "Simuler la campagne"}</button>
          ) : (
            <button type="button" onClick={publish} disabled={busy || !sim || user.balance < sim.budgetXaf} className="h-[84px] rounded-2xl bg-primary text-[19px] font-bold text-white disabled:opacity-60">{busy ? <span className="spinner" /> : "Publier la campagne"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chips({ items, onRemove }: { items: { key: string; label: string }[]; onRemove: (k: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((i) => (
        <button key={i.key} type="button" onClick={() => onRemove(i.key)} className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-[15px] font-semibold text-primary">{i.label} <X className="h-4 w-4" /></button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 mt-7 text-[21px] font-bold text-ink">{children} <span className="text-red-500">*</span></p>;
}
function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface px-5 py-5">
      <p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-ink">{value}</p>
      {sub && <p className="text-[14px] text-gray-500">{sub}</p>}
    </div>
  );
}
