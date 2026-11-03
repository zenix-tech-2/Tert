/* Brand-style icons drawn as inline SVG (no external assets needed). */

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m0 1.67c4.56 0 8.24 3.69 8.24 8.24 0 4.56-3.68 8.24-8.24 8.24-1.56 0-3.02-.43-4.28-1.19l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.34c0-4.55 3.69-8.24 8.33-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
    </svg>
  );
}

/* --- Mobile money operator badges ---------------------------------- */

export function MtnBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#0f3d5e" />
      <ellipse cx="32" cy="32" rx="20" ry="11" fill="#ffcc00" />
      <text x="32" y="36" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f3d5e" fontFamily="Arial, sans-serif">
        MoMo
      </text>
      <text x="32" y="50" textAnchor="middle" fontSize="6" fontWeight="700" fill="#ffcc00" fontFamily="Arial, sans-serif">
        from MTN
      </text>
    </svg>
  );
}

export function OrangeBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#111" />
      <rect x="18" y="18" width="28" height="28" rx="4" fill="#ff7900" />
      <rect x="18" y="39" width="28" height="7" fill="#fff" />
      <text x="32" y="45" textAnchor="middle" fontSize="6" fontWeight="800" fill="#111" fontFamily="Arial, sans-serif">
        orange
      </text>
    </svg>
  );
}

export function AirtelBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#e40000" />
      <path d="M20 42c4-14 18-20 24-14 5 5-4 12-12 10s-6-10 2-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function MoovBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#f26522" />
      <text x="32" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        MOOV
      </text>
      <text x="32" y="44" textAnchor="middle" fontSize="11" fontStyle="italic" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        Money
      </text>
      <circle cx="48" cy="18" r="6" fill="#1b4fa0" />
    </svg>
  );
}

export function CeltiisBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#0b2a6b" />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        celtiis
      </text>
      <text x="32" y="48" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8bd3ff" fontFamily="Arial, sans-serif">
        Cash
      </text>
      <circle cx="46" cy="22" r="4" fill="#58d68d" />
    </svg>
  );
}

export function CorisBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#1aa3dd" />
      <path d="M40 20c-12-4-22 6-18 16 3 7 12 8 18 4" fill="none" stroke="#ffd400" strokeWidth="5" strokeLinecap="round" />
      <text x="32" y="54" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        CORIS MONEY
      </text>
    </svg>
  );
}

export function WaveBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#1dc3f5" />
      <path d="M14 36c6-10 12-10 18 0s12 10 18 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function GenericOperatorBadge({ label, className = "h-16 w-16" }: { label: string; className?: string }) {
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#3b47f3" />
      <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        {initials}
      </text>
    </svg>
  );
}

export function OperatorBadge({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes("mtn")) return <MtnBadge className={className} />;
  if (n.includes("orange")) return <OrangeBadge className={className} />;
  if (n.includes("airtel")) return <AirtelBadge className={className} />;
  if (n.includes("moov") || n.includes("flooz")) return <MoovBadge className={className} />;
  if (n.includes("celtiis")) return <CeltiisBadge className={className} />;
  if (n.includes("coris")) return <CorisBadge className={className} />;
  if (n.includes("wave")) return <WaveBadge className={className} />;
  return <GenericOperatorBadge label={name} className={className} />;
}

/* --- Payment method cluster illustrations ---------------------------- */

export function MobileMoneyCluster() {
  return (
    <div className="relative mx-auto h-[150px] w-[260px]">
      {/* MTN */}
      <div className="absolute left-0 top-2 flex h-[124px] w-[124px] items-center justify-center rounded-full border-[5px] border-[#ffcc00] bg-[#0f3d5e] shadow-lg">
        <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
          <rect x="22" y="10" width="20" height="36" rx="4" fill="#ffcc00" />
          <rect x="25" y="14" width="14" height="24" rx="1" fill="#0f3d5e" />
          <path d="M20 46c6 4 14 4 20 0l6 8H16z" fill="#ffcc00" />
        </svg>
      </div>
      {/* Orange */}
      <div className="absolute left-[78px] top-6 flex h-[110px] w-[110px] items-center justify-center rounded-full border-[5px] border-[#ff7900] bg-black shadow-lg">
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
          <path d="M14 24h26l-7-7" fill="none" stroke="#ff7900" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 40H24l7 7" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* Airtel */}
      <div className="absolute left-[150px] top-10 flex h-[106px] w-[106px] items-center justify-center rounded-full bg-[#e40000] shadow-lg">
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
          <path d="M18 44c4-16 20-22 26-14 5 6-4 14-13 11-8-3-5-12 3-13" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function CryptoCluster() {
  return (
    <div className="relative mx-auto h-[120px] w-[200px]">
      <div className="absolute left-0 top-2 flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#2775ca] shadow-lg">
        <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
          <circle cx="32" cy="32" r="22" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="100 30" strokeLinecap="round" />
          <text x="32" y="41" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
            $
          </text>
        </svg>
      </div>
      <div className="absolute left-[92px] top-2 flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#26a17b] shadow-lg">
        <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
          <rect x="16" y="16" width="32" height="8" fill="#fff" />
          <rect x="28" y="16" width="8" height="32" fill="#fff" />
          <ellipse cx="32" cy="32" rx="18" ry="6" fill="none" stroke="#fff" strokeWidth="4" />
        </svg>
      </div>
    </div>
  );
}

export function UsdcIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#2775ca" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="90 30" strokeLinecap="round" />
      <text x="32" y="40" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        $
      </text>
    </svg>
  );
}

export function UsdtIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#26a17b" />
      <rect x="18" y="18" width="28" height="7" fill="#fff" />
      <rect x="28.5" y="18" width="7" height="28" fill="#fff" />
      <ellipse cx="32" cy="32" rx="16" ry="5" fill="none" stroke="#fff" strokeWidth="3.5" />
    </svg>
  );
}
