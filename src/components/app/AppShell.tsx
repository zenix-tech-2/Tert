"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Contact,
  DollarSign,
  Download,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MessageSquareDashed,
  MessagesSquare,
  MoreHorizontal,
  PieChart,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Store,
  TrendingUp,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { DbiLogo } from "./Logo";
import { WhatsAppIcon } from "@/components/BrandIcons";

/* ------------------------------------------------------------------ */
/* Shared user context                                                 */
/* ------------------------------------------------------------------ */

export type AppUser = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  countryCode: string;
  referralCode: string;
  matricule: string | null;
  balance: number;
  gains: number;
  balanceUsd: number;
  feuilles: number;
  totalWithdrawn: number;
  avatarUrl: string | null;
  status: string;
};

const UserCtx = createContext<{ user: AppUser; refresh: () => Promise<void> } | null>(null);
export function useAppUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useAppUser outside AppShell");
  return ctx;
}

const LINKS = {
  whatsappCommunity: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "https://chat.whatsapp.com/",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/",
};

/* ------------------------------------------------------------------ */

const FeatureCtx = createContext<{ smmEnabled: boolean }>({ smmEnabled: false });
export function useFeatures() {
  return useContext(FeatureCtx);
}

export default function AppShell({ user: initial, children, features = { smmEnabled: false } }: { user: AppUser; children: ReactNode; features?: { smmEnabled: boolean } }) {
  const [user, setUser] = useState(initial);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const r = await fetch("/api/dashboard/summary", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setUser(d.user);
    }
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <UserCtx.Provider value={{ user, refresh }}>
      <FeatureCtx.Provider value={features}>
      <div className="min-h-dvh pb-36">
        <TopBar onMenu={() => setDrawer(true)} open={drawer} name={user.name} />
        <Drawer open={drawer} onClose={() => setDrawer(false)} />
        <main className="mx-auto max-w-md px-6 pt-6">{children}</main>
        <BottomNav />
      </div>
      </FeatureCtx.Provider>
    </UserCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar                                                             */
/* ------------------------------------------------------------------ */

function TopBar({ onMenu, open, name }: { onMenu: () => void; open: boolean; name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
        <button type="button" onClick={onMenu} aria-label="Menu" className="p-1 text-gray-700">
          {open ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" strokeWidth={2} />}
        </button>
        <Link href="/dashboard" className="shrink-0">
          <DbiLogo className="h-9 w-auto" />
        </Link>

        {/* Stories */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-[#19c37d] bg-white text-[18px] font-extrabold text-primary">
              DBI
            </span>
            <span className="mt-1 h-1 w-14 rounded-full bg-gray-300" />
          </div>
          <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-[#19c37d] bg-gradient-to-br from-gray-700 to-gray-900 text-[16px] font-bold text-white">
            {initials}
          </span>
          <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-[#19c37d] bg-gradient-to-br from-sky-300 via-emerald-400 to-emerald-700 text-white">
            <Sparkles className="h-7 w-7" />
          </span>
          <Link href="/dashboard/notifications" aria-label="Notifications" className="flex h-[70px] w-[70px] items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700">
            <Bell className="h-7 w-7" strokeWidth={1.8} />
          </Link>
          <Link href="/dashboard/reglages" aria-label="Plus" className="p-1 text-gray-700">
            <MoreHorizontal className="h-7 w-7" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

type Item = { label: string; href: string; icon: ReactNode; bg: string; expandable?: boolean; soonIfNoSmm?: boolean };

const MENU: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutGrid />, bg: "bg-primary-soft text-primary" },
  { label: "Dépôt", href: "/dashboard/depot", icon: <DollarSign />, bg: "bg-emerald-50 text-emerald-600" },
  { label: "Portefeuilles", href: "/dashboard/portefeuilles", icon: <LayoutGrid />, bg: "bg-emerald-50 text-emerald-600" },
  { label: "Retrait", href: "/dashboard/retrait", icon: <Download />, bg: "bg-orange-50 text-orange-500" },
  { label: "Transfert DBI", href: "/dashboard/transfert", icon: <Send />, bg: "bg-sky-50 text-sky-500" },
  { label: "Transactions", href: "/dashboard/transactions", icon: <PieChart />, bg: "bg-purple-50 text-purple-600" },
  { label: "Statuts", href: "/dashboard/statuts", icon: <MessageSquareDashed />, bg: "bg-rose-50 text-rose-500" },
  { label: "Services SMM", href: "/dashboard/smm", icon: <TrendingUp />, bg: "bg-primary-soft text-primary", soonIfNoSmm: true },
  { label: "Chat DBI", href: "/dashboard/messenger", icon: <MessagesSquare />, bg: "bg-cyan-50 text-cyan-600" },
  { label: "Relance", href: "/dashboard/relance", icon: <RefreshCw />, bg: "bg-amber-50 text-[#1d2b6b]" },
  { label: "Email Marketing", href: "/dashboard/email-marketing", icon: <Mail />, bg: "bg-indigo-50 text-indigo-600" },
  { label: "Boutique digitale", href: "/dashboard/boutique", icon: <Store />, bg: "bg-gray-100 text-gray-900", expandable: true },
  { label: "Formations", href: "/dashboard/formations", icon: <GraduationCap />, bg: "bg-amber-50 text-gray-900" },
  { label: "Ebooks", href: "/dashboard/ebooks", icon: <BookOpen />, bg: "bg-gray-100 text-gray-900" },
  { label: "Opportunités Business", href: "/dashboard/opportunites", icon: <Sparkles />, bg: "bg-emerald-50 text-emerald-700" },
  { label: "Contacts", href: "/dashboard/contacts", icon: <Contact />, bg: "bg-gray-100 text-gray-900" },
  { label: "Parrainage", href: "/dashboard/parrainage", icon: <Users />, bg: "bg-primary-soft text-primary" },
  { label: "Mes Gains", href: "/dashboard/gains", icon: <TrendingUp />, bg: "bg-lime-50 text-emerald-700" },
  { label: "Nos Communautés", href: "/dashboard/communautes", icon: <Users />, bg: "bg-cyan-50 text-gray-900" },
];

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { smmEnabled } = useFeatures();
  const [shopOpen, setShopOpen] = useState(false);
  return (
    <>
      <div
        onClick={onClose}
        className={"fixed inset-0 z-40 bg-black/40 transition-opacity " + (open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 w-[82%] max-w-sm overflow-y-auto bg-white px-6 pb-40 pt-8 shadow-2xl transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between">
          <DbiLogo className="h-12 w-auto" />
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1 text-gray-600">
            <X className="h-7 w-7" />
          </button>
        </div>

        <p className="mt-10 text-[17px] uppercase tracking-wide text-gray-400">Menu</p>
        <nav className="mt-3 space-y-1">
          {MENU.map((it) => {
            const active = pathname === it.href;
            return (
              <div key={it.href}>
                <Link
                  href={it.href}
                  onClick={(e) => {
                    if (it.expandable) {
                      e.preventDefault();
                      setShopOpen((s) => !s);
                    }
                  }}
                  className={
                    "flex items-center gap-5 rounded-2xl px-3 py-4 text-[22px] transition " +
                    (active ? "bg-primary-soft font-semibold text-primary" : "text-gray-800 hover:bg-gray-50")
                  }
                >
                  <span className={"flex h-14 w-14 items-center justify-center rounded-xl [&>svg]:h-7 [&>svg]:w-7 " + (active ? "bg-transparent text-primary" : it.bg)}>
                    {it.icon}
                  </span>
                  <span className="flex-1">{it.label}</span>
                  {it.soonIfNoSmm && !smmEnabled && <span className="rounded-lg bg-[#f8b61a] px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#111a2e]">BIENTÔT</span>}
                  {it.expandable && <ChevronDown className={"h-6 w-6 transition " + (shopOpen ? "rotate-180" : "")} />}
                </Link>
                {it.expandable && shopOpen && (
                  <div className="ml-20 space-y-1 pb-2">
                    <Link href="/dashboard/boutique" className="block rounded-xl px-3 py-2 text-[18px] text-gray-700 hover:bg-gray-50">
                      Digital Store
                    </Link>
                    <Link href="/dashboard/boutique/mes-produits" className="block rounded-xl px-3 py-2 text-[18px] text-gray-700 hover:bg-gray-50">
                      Mes produits
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <p className="mt-8 text-[17px] uppercase tracking-wide text-gray-400">Autres</p>
        <Link href="/dashboard" className="mt-3 flex items-center gap-5 rounded-2xl px-3 py-4 text-[22px] text-gray-800 hover:bg-gray-50">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
            <LayoutGrid className="h-7 w-7" />
          </span>
          Accueil
        </Link>

        {/* Community card */}
        <div className="mt-6 rounded-3xl bg-surface px-7 py-8 text-center">
          <p className="text-[24px] font-bold text-ink">Communauté DBI</p>
          <p className="mt-2 text-[19px] leading-snug text-gray-500">Rejoignez nos canaux officiels et restez informé.</p>
          <a
            href={LINKS.whatsappCommunity}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex h-[72px] w-full items-center justify-center gap-3 rounded-2xl bg-[#19c37d] text-[22px] font-bold text-white"
          >
            <WhatsAppIcon className="h-7 w-7" />
            Communauté
          </a>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SocialBtn href={LINKS.whatsapp} icon={<WhatsAppIcon className="h-6 w-6 text-[#19c37d]" />} label="WhatsApp" />
            <SocialBtn href={LINKS.telegram} icon={<Send className="h-6 w-6 text-ink" />} label="Telegram" />
            <SocialBtn href={LINKS.facebook} icon={<FacebookIcon />} label="Facebook" />
            <SocialBtn href={LINKS.instagram} icon={<InstagramIcon />} label="Instagram" />
          </div>
        </div>

        <DrawerLogout />
      </aside>
    </>
  );
}

function SocialBtn({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex h-[60px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-[18px] font-semibold text-ink">
      {icon}
      {label}
    </a>
  );
}

function DrawerLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="mt-6 flex w-full items-center gap-5 rounded-2xl px-3 py-4 text-[22px] text-gray-800 hover:bg-gray-50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <LogOut className="h-7 w-7" />
      </span>
      Se déconnecter
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom nav                                                          */
/* ------------------------------------------------------------------ */

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Accueil", icon: LayoutGrid },
    { href: "/dashboard/depot", label: "Dépôt", icon: Wallet },
    null,
    { href: "/dashboard/retrait", label: "Retrait", icon: Download },
    { href: "/dashboard/reglages", label: "Réglages", icon: UserCircle },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-6 pb-5">
      <div className="relative mx-auto max-w-md rounded-[36px] border border-gray-200 bg-white px-3 pb-3 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {/* Center FAB */}
        <Link
          href="/dashboard/statuts"
          className="absolute left-1/2 top-0 flex h-[130px] w-[130px] -translate-x-1/2 -translate-y-[58px] items-center justify-center rounded-full bg-white"
        >
          <span className="flex h-[118px] w-[118px] items-center justify-center rounded-full bg-primary text-white shadow-lg">
            <MessageCircle className="h-12 w-12" strokeWidth={2} />
          </span>
        </Link>
        <div className="grid grid-cols-5 items-end">
          {items.map((it, i) =>
            it ? (
              <Link
                key={it.href}
                href={it.href}
                className={
                  "flex flex-col items-center gap-1 rounded-2xl py-3 text-[17px] font-medium transition " +
                  (pathname === it.href ? "bg-primary-soft text-primary font-bold" : "text-gray-500")
                }
              >
                <it.icon className="h-8 w-8" strokeWidth={1.8} />
                {it.label}
              </Link>
            ) : (
              <div key={i} className="flex flex-col items-center justify-end pb-3 pt-14 text-[17px] font-bold text-gray-600">
                Statuts
              </div>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#1877f2" aria-hidden>
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f9ce34" />
          <stop offset="0.5" stopColor="#ee2a7b" />
          <stop offset="1" stopColor="#6228d7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="#fff" />
    </svg>
  );
}

export { Settings as SettingsIcon };
