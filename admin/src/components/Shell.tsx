"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownToLine, BookOpen, Contact, CreditCard, LayoutGrid, LogOut, Megaphone, Menu, MessagesSquare, PieChart, Settings, ShieldCheck, TrendingUp, Users, X } from "lucide-react";

export function DbiLogo({ className = "h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 56" className={className} aria-label="DBI Admin">
      <g stroke="#f5c400" strokeWidth="2.4" strokeLinecap="round"><line x1="14" y1="6" x2="14" y2="1" /><line x1="5" y1="10" x2="1.5" y2="6.5" /><line x1="23" y1="10" x2="26.5" y2="6.5" /></g>
      <path d="M14 8a8 8 0 0 0-4.5 14.6c.9.7 1.5 1.7 1.5 2.9V27h6v-1.5c0-1.2.6-2.2 1.5-2.9A8 8 0 0 0 14 8z" fill="none" stroke="#1d2b6b" strokeWidth="2.2" />
      <rect x="10.5" y="28.5" width="7" height="3" rx="1" fill="#1d2b6b" /><path d="M22 24c4-1 7 1 8 4-3 1-6 0-8-4z" fill="#19a85a" />
      <text x="34" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#1d2b6b">D</text>
      <text x="55" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#19a85a">B</text>
      <text x="75" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#1d2b6b">I</text>
      <text x="34" y="46" fontFamily="Outfit, Arial, sans-serif" fontWeight="700" fontSize="8" letterSpacing="1" fill="#b8862b">ADMINISTRATION</text>
    </svg>
  );
}

export const NAV = [
  { href: "/", label: "Tableau de bord", icon: <LayoutGrid />, bg: "bg-primary-soft text-primary" },
  { href: "/members", label: "Membres", icon: <Users />, bg: "bg-emerald-50 text-emerald-600" },
  { href: "/withdrawals", label: "Retraits", icon: <ArrowDownToLine />, bg: "bg-orange-50 text-orange-500" },
  { href: "/payments", label: "Paiements", icon: <CreditCard />, bg: "bg-sky-50 text-sky-600" },
  { href: "/transactions", label: "Transactions", icon: <PieChart />, bg: "bg-purple-50 text-purple-600" },
  { href: "/ads", label: "Ads Network", icon: <Megaphone />, bg: "bg-rose-50 text-rose-500" },
  { href: "/catalog", label: "Catalogue", icon: <BookOpen />, bg: "bg-amber-50 text-amber-700" },
  { href: "/contacts", label: "Contacts", icon: <Contact />, bg: "bg-gray-100 text-gray-800" },
  { href: "/support", label: "Support", icon: <MessagesSquare />, bg: "bg-cyan-50 text-cyan-600" },
  { href: "/smm", label: "SMM", icon: <TrendingUp />, bg: "bg-indigo-50 text-indigo-600" },
  { href: "/settings", label: "Paramètres", icon: <Settings />, bg: "bg-gray-100 text-gray-800" },
];

export default function Shell({ admin, children }: { admin: { name: string; email: string }; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => setOpen(false), [pathname]);
  const initials = admin.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const current = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));

  async function logout() { await fetch("/api/auth", { method: "DELETE" }); router.push("/login"); router.refresh(); }

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar (desktop) / drawer (mobile) */}
      <div onClick={() => setOpen(false)} className={"fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden " + (open ? "opacity-100" : "pointer-events-none opacity-0")} />
      <aside className={"fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs overflow-y-auto border-r border-[#ebe3cf] bg-white px-5 pb-10 pt-6 transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:shrink-0 lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between"><DbiLogo className="h-12 w-auto" /><button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-600 lg:hidden" aria-label="Fermer"><X className="h-7 w-7" /></button></div>
        <p className="mt-8 text-[14px] uppercase tracking-wide text-gray-400">Menu</p>
        <nav className="mt-2 space-y-1">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={"flex items-center gap-4 rounded-2xl px-3 py-3 text-[18px] transition " + (active ? "bg-primary-soft font-semibold text-primary" : "text-gray-800 hover:bg-gray-50")}>
                <span className={"flex h-11 w-11 items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6 " + (active ? "text-primary" : n.bg)}>{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={logout} className="mt-6 flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-[18px] text-gray-800 hover:bg-gray-50"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500"><LogOut className="h-6 w-6" /></span>Se déconnecter</button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[#ebe3cf] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
            <button type="button" onClick={() => setOpen(true)} className="p-1 text-gray-700 lg:hidden" aria-label="Menu"><Menu className="h-8 w-8" /></button>
            <Link href="/" className="lg:hidden"><DbiLogo className="h-9 w-auto" /></Link>
            <h1 className="hidden text-[22px] font-bold text-ink lg:block">{current?.label ?? "Admin"}</h1>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-[#ebe3cf] bg-white px-4 py-2 text-[14px] font-semibold text-[#8a6a1f] sm:flex"><ShieldCheck className="h-4 w-4" /> Administrateur</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b8862b] to-[#8a6a1f] text-[16px] font-bold text-white" title={admin.email}>{initials}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

/* ---------- shared UI bits ---------- */
export const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
export const fdate = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function Kpi({ label, value, sub, cls = "bg-primary-soft text-primary", icon }: { label: string; value: string; sub?: string; cls?: string; icon?: ReactNode }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-5">
      {icon && <span className={"flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-7 [&>svg]:w-7 " + cls}>{icon}</span>}
      <div className="min-w-0"><p className="truncate text-[13px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="truncate text-[24px] font-extrabold leading-tight text-ink">{value}</p>{sub && <p className="text-[13px] text-gray-500">{sub}</p>}</div>
    </div>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "amber" | "red" | "blue" | "purple" }) {
  const cls = { gray: "bg-gray-100 text-gray-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-700", purple: "bg-purple-50 text-purple-700" }[tone];
  return <span className={"inline-block rounded-lg px-2.5 py-1 text-[12px] font-bold " + cls}>{children}</span>;
}

export function statusTone(s: string): "gray" | "green" | "amber" | "red" | "blue" | "purple" {
  if (["active", "completed", "success", "verified", "published"].includes(s)) return "green";
  if (["pending", "submitted", "otp_required", "created"].includes(s)) return "amber";
  if (["failed", "rejected", "expired", "canceled", "cancelled"].includes(s)) return "red";
  if (["approved", "in_progress", "processing"].includes(s)) return "blue";
  if (["partial"].includes(s)) return "purple";
  return "gray";
}

export function Tabs({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: { v: string; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => <button key={t.v} type="button" onClick={() => onChange(t.v)} className={"rounded-full border px-4 py-2 text-[14px] font-semibold " + (value === t.v ? "border-primary bg-primary text-white" : "border-[#ebe3cf] bg-white text-gray-700")}>{t.l}</button>)}
    </div>
  );
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-[14px] text-gray-600">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">‹</button>
      Page {page} / {pages}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">›</button>
    </div>
  );
}

export function Btn({ children, onClick, tone = "primary", disabled, small }: { children: ReactNode; onClick?: () => void; tone?: "primary" | "green" | "red" | "ghost"; disabled?: boolean; small?: boolean }) {
  const cls = { primary: "bg-primary text-white", green: "bg-[#0ea35f] text-white", red: "bg-red-500 text-white", ghost: "border border-[#ebe3cf] bg-white text-ink" }[tone];
  return <button type="button" onClick={onClick} disabled={disabled} className={"inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 " + cls + (small ? " h-10 px-3 text-[13px]" : " h-12 px-5 text-[15px]")}>{children}</button>;
}

export function Toast({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p className={"mt-4 rounded-2xl px-4 py-3 text-[15px] font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p>;
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Erreur");
  return d as T;
}
