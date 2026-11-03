"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { api, fdate } from "@/components/Shell";

type Conv = { id: string; name: string; email: string; whatsapp: string; last_body: string; last_at: string; unread: number };
type Msg = { id: string; sender: string; body: string; attachmentUrl: string | null; attachmentType: string | null; createdAt: string };

export default function SupportPage() {
  const [inbox, setInbox] = useState<Conv[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<{ items: Msg[]; user: { name: string; email: string; whatsapp: string; matricule: string | null; status: string } } | null>(null);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const loadInbox = useCallback(() => fetch("/api/support").then((r) => r.json()).then((d) => setInbox(d.inbox)), []);
  const loadThread = useCallback(() => { if (sel) fetch(`/api/support?userId=${sel}`).then((r) => r.json()).then(setThread); }, [sel]);
  useEffect(() => { loadInbox(); const i = setInterval(loadInbox, 15000); return () => clearInterval(i); }, [loadInbox]);
  useEffect(() => { loadThread(); const i = setInterval(loadThread, 8000); return () => clearInterval(i); }, [loadThread]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.items.length]);
  async function send() { if (!sel || !text.trim()) return; await api("/api/support", { method: "POST", body: JSON.stringify({ userId: sel, body: text.trim() }) }); setText(""); loadThread(); loadInbox(); }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <section className="card max-h-[75vh] overflow-y-auto">
        <h3 className="px-5 pt-5 text-[18px] font-bold text-ink">Conversations</h3>
        <ul className="mt-2 divide-y divide-gray-100">
          {inbox.map((c) => (
            <li key={c.id}><button type="button" onClick={() => setSel(c.id)} className={"w-full px-5 py-3 text-left hover:bg-surface " + (sel === c.id ? "bg-primary-soft/60" : "")}>
              <div className="flex items-center justify-between"><p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>{c.unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">{c.unread}</span>}</div>
              <p className="truncate text-[13px] text-gray-500">{c.last_body || "📎 pièce jointe"}</p><p className="text-[11px] text-gray-400">{fdate(c.last_at)}</p>
            </button></li>
          ))}
          {inbox.length === 0 && <li className="px-5 py-8 text-center text-[14px] text-gray-500">Aucune conversation.</li>}
        </ul>
      </section>
      <section className="card flex max-h-[75vh] min-h-[480px] flex-col">
        {thread ? (
          <>
            <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0e1a3d] text-[#d4af37]"><ShieldCheck className="h-6 w-6" /></span><div><p className="text-[16px] font-bold text-ink">{thread.user.name}</p><p className="text-[12px] text-gray-500">{thread.user.email} · {thread.user.whatsapp} · {thread.user.matricule} · {thread.user.status}</p></div></header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#eef0f6] px-5 py-5 [background-image:radial-gradient(#d9dce6_1.2px,transparent_1.2px)] [background-size:22px_22px]">
              {thread.items.map((m) => (
                <div key={m.id} className={"flex " + (m.sender === "support" ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[75%] rounded-2xl px-4 py-3 text-[14px] shadow-sm " + (m.sender === "support" ? "rounded-br-md bg-[#1e1bb3] text-white" : "rounded-bl-md bg-white text-ink")}>
                    {m.attachmentType === "image" && m.attachmentUrl && <img src={m.attachmentUrl} alt="" className="mb-2 max-h-64 rounded-xl" />}
                    {m.attachmentType === "audio" && m.attachmentUrl && <audio controls src={m.attachmentUrl} className="mb-2 w-56" />}
                    {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                    <p className={"mt-1 text-right text-[10px] " + (m.sender === "support" ? "text-white/70" : "text-gray-400")}>{fdate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <form className="flex items-center gap-2 border-t border-gray-100 px-4 py-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input className="input !h-12 text-[15px]" placeholder="Répondre au membre…" value={text} onChange={(e) => setText(e.target.value)} />
              <button type="submit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e1bb3] text-white" aria-label="Envoyer"><Send className="h-5 w-5" /></button>
            </form>
          </>
        ) : <p className="m-auto text-[15px] text-gray-500">Sélectionnez une conversation.</p>}
      </section>
    </div>
  );
}
