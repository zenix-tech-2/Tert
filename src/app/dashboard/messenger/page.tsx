"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Camera, ImagePlus, LogOut, Mic, MoreVertical, Phone, Send, ShieldCheck, Square, Sun, Volume2, X } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";

type Msg = { id: string; sender: "user" | "support"; body: string; attachmentUrl: string | null; attachmentType: string | null; createdAt: string };

export default function MessengerPage() {
  const { user } = useAppUser();
  const router = useRouter();
  const [items, setItems] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [prefs, setPrefs] = useState({ dark: false, sound: true, notif: false });
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastRef = useRef<string | null>(null);

  const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const load = useCallback(async () => {
    const r = await fetch(`/api/support/messages${lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : ""}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    if (d.items.length) {
      setItems((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...d.items.filter((m: Msg) => !ids.has(m.id))];
        lastRef.current = merged[merged.length - 1]?.createdAt ?? lastRef.current;
        if (prev.length && d.items.some((m: Msg) => m.sender === "support") && prefs.sound) beep();
        return merged;
      });
    }
  }, [prefs.sound]);

  useEffect(() => { load(); const i = setInterval(load, 6000); return () => clearInterval(i); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items.length]);
  useEffect(() => {
    try { const p = JSON.parse(localStorage.getItem("dbi-msg-prefs") || "{}"); setPrefs((x) => ({ ...x, ...p, notif: typeof Notification !== "undefined" && Notification.permission === "granted" })); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("dbi-msg-prefs", JSON.stringify(prefs)); document.documentElement.classList.toggle("dark", prefs.dark); }, [prefs]);

  async function send(payload: { body?: string; attachmentUrl?: string; attachmentType?: "image" | "audio" }) {
    setBusy(true);
    const r = await fetch("/api/support/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: payload.body ?? "", attachmentUrl: payload.attachmentUrl, attachmentType: payload.attachmentType }) });
    setBusy(false);
    if (!r.ok) return;
    const d = await r.json();
    setItems((prev) => [...prev, d.message, ...(d.reply ? [d.reply] : [])]);
    lastRef.current = (d.reply ?? d.message).createdAt;
    setText("");
  }

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) return alert("Image trop lourde (max 2 Mo).");
    const rd = new FileReader();
    rd.onload = () => send({ attachmentUrl: String(rd.result), attachmentType: "image", body: text });
    rd.readAsDataURL(f);
    e.target.value = "";
  }

  async function toggleRecord() {
    if (recording) { recRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 2_500_000) return alert("Note vocale trop longue.");
        const rd = new FileReader();
        rd.onload = () => send({ attachmentUrl: String(rd.result), attachmentType: "audio" });
        rd.readAsDataURL(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch { alert("Micro indisponible sur cet appareil."); }
  }

  async function enableNotif() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPrefs((x) => ({ ...x, notif: p === "granted" }));
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  const lastSupport = [...items].reverse().find((m) => m.sender === "support");

  return (
    <div className="-mx-6 -mt-6 flex min-h-[calc(100dvh-110px)] flex-col bg-[#eef0f6] [background-image:radial-gradient(#d9dce6_1.5px,transparent_1.5px)] [background-size:28px_28px]">
      {/* Chat header */}
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-5 py-4">
        <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-[#d4af37] bg-[#1e1bb3] text-[20px] font-extrabold text-white">DBI</span>
        <div className="flex-1">
          <p className="font-serif text-[30px] font-semibold leading-tight text-ink">Support DBI</p>
          <p className="text-[17px] text-gray-500">{lastSupport ? `vu à ${new Date(lastSupport.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "en ligne"}</p>
        </div>
        <button type="button" onClick={() => setSheet(true)} className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#b8862b] to-[#8a6a1f] text-[22px] font-bold text-white">{initials}</button>
        <button type="button" onClick={() => setSheet(true)} aria-label="Menu" className="p-1 text-ink"><MoreVertical className="h-7 w-7" /></button>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-8">
        <div className="card mx-auto px-8 py-12 text-center">
          <span className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-[#0e1a3d] text-[#d4af37]"><ShieldCheck className="h-11 w-11" /></span>
          <p className="mt-8 font-serif text-[34px] font-semibold leading-tight text-ink">Bonjour<br /><span className="break-all">{user.email}</span></p>
          <p className="mt-5 text-[21px] leading-snug text-gray-500">Cette ligne est privée et vous relie directement à l&apos;équipe de l&apos;académie. Posez votre question, envoyez une capture ou une note vocale.</p>
        </div>
        {items.map((m) => (
          <div key={m.id} className={"flex " + (m.sender === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[82%] rounded-3xl px-5 py-4 shadow-sm " + (m.sender === "user" ? "rounded-br-md bg-[#1e1bb3] text-white" : "rounded-bl-md bg-white text-ink")}>
              {m.attachmentType === "image" && m.attachmentUrl && <img src={m.attachmentUrl} alt="" className="mb-2 max-h-72 rounded-2xl" />}
              {m.attachmentType === "audio" && m.attachmentUrl && <audio controls src={m.attachmentUrl} className="mb-2 w-60" />}
              {m.body && <p className="whitespace-pre-wrap text-[18px] leading-snug">{m.body}</p>}
              <p className={"mt-1 text-right text-[12px] " + (m.sender === "user" ? "text-white/70" : "text-gray-400")}>{new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-[150px] flex items-center gap-3 border-t border-gray-200 bg-[#eef0f6]/95 px-5 py-4 backdrop-blur">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Image" className="p-2 text-gray-700"><ImagePlus className="h-8 w-8" /></button>
        <form className="flex flex-1 items-center" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send({ body: text }); }}>
          <input className="h-[76px] w-full rounded-full border border-gray-300 bg-white px-7 text-[20px] outline-none placeholder:text-gray-400" placeholder="Écrire un message" value={text} onChange={(e) => setText(e.target.value)} />
        </form>
        {text.trim() ? (
          <button type="button" disabled={busy} onClick={() => send({ body: text })} aria-label="Envoyer" className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#1e1bb3] text-white"><Send className="h-7 w-7" /></button>
        ) : (
          <button type="button" onClick={toggleRecord} aria-label="Note vocale" className={"flex h-[76px] w-[76px] items-center justify-center rounded-full " + (recording ? "bg-red-500 text-white" : "bg-white text-ink shadow")}>{recording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}</button>
        )}
      </div>

      {/* Profile sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setSheet(false)}>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md overflow-hidden rounded-t-[36px] bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden bg-[#0e1a3d] px-8 pb-9 pt-10 text-white">
              <div className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/15" /><div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/15" />
              <button type="button" onClick={() => setSheet(false)} aria-label="Fermer" className="absolute right-6 top-6 p-1 text-white/70"><X className="h-7 w-7" /></button>
              <p className="font-serif text-[36px] font-semibold">Profil et préférences</p>
              <p className="mt-1 text-[21px] text-white/70">Membre · DBI Messenger</p>
              <div className="mt-8 flex items-center gap-6">
                <div className="relative">
                  <span className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-[#b8862b] to-[#8a6a1f] text-[48px] font-bold">{initials}</span>
                  <span className="absolute bottom-1 right-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#d4af37] text-[#0e1a3d]"><Camera className="h-6 w-6" /></span>
                </div>
                <div className="min-w-0"><p className="truncate text-[24px] font-semibold">{user.email}</p><p className="mt-2 flex items-center gap-3 text-[21px] text-white/80"><Phone className="h-6 w-6" /> {user.whatsapp}</p></div>
              </div>
              <p className="mt-6 text-[18px] text-white/60">Recadrée au centre, redimensionnée et stockée en privé.</p>
            </div>
            <div className="divide-y divide-gray-200">
              <Pref icon={<Sun />} title="Thème sombre" sub="Plus doux le soir." right={<Toggle on={prefs.dark} onChange={(v) => setPrefs({ ...prefs, dark: v })} />} />
              <Pref icon={<Volume2 />} title="Son des nouveaux messages" sub="Joué uniquement après une interaction." right={<Toggle on={prefs.sound} onChange={(v) => setPrefs({ ...prefs, sound: v })} />} />
              <Pref icon={<Bell />} title="Notifications" sub={prefs.notif ? "Notifications activées sur cet appareil." : "Activez les notifications pour ne rien manquer."} right={<button type="button" onClick={enableNotif} className="rounded-full bg-[#e3e8f8] px-7 py-4 text-[19px] font-semibold text-[#0e1a3d]">{prefs.notif ? "Réactiver" : "Activer"}</button>} />
              <Pref icon={<ShieldCheck />} title="Connexion privée" sub="Vos échanges restent entre vous et l'équipe de l'académie." />
            </div>
            <div className="px-8 py-6"><button type="button" onClick={logout} className="flex h-[84px] w-full items-center justify-center gap-3 rounded-full border border-red-300 text-[22px] font-medium text-red-600"><LogOut className="h-6 w-6" /> Se déconnecter</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pref({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5 px-8 py-6">
      <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#e3e8f8] text-[#1e1bb3] [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <div className="min-w-0 flex-1"><p className="text-[23px] font-medium text-ink">{title}</p><p className="text-[19px] leading-snug text-gray-500">{sub}</p></div>
      {right}
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={"relative h-10 w-[72px] shrink-0 rounded-full transition " + (on ? "bg-[#1e1bb3]" : "bg-gray-300")}>
      <span className={"absolute top-1 h-8 w-8 rounded-full bg-white shadow transition " + (on ? "left-[38px]" : "left-1")} />
    </button>
  );
}
function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.05;
    o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
}
