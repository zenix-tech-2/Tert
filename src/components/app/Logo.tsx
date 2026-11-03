export function DbiLogo({ className = "h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 56" className={className} aria-label="DBI – Digital Business Institution">
      {/* bulb rays */}
      <g stroke="#f5c400" strokeWidth="2.4" strokeLinecap="round">
        <line x1="14" y1="6" x2="14" y2="1" />
        <line x1="5" y1="10" x2="1.5" y2="6.5" />
        <line x1="23" y1="10" x2="26.5" y2="6.5" />
        <line x1="2" y1="19" x2="-2" y2="19" />
      </g>
      {/* bulb */}
      <path d="M14 8a8 8 0 0 0-4.5 14.6c.9.7 1.5 1.7 1.5 2.9V27h6v-1.5c0-1.2.6-2.2 1.5-2.9A8 8 0 0 0 14 8z" fill="none" stroke="#1d2b6b" strokeWidth="2.2" />
      <rect x="10.5" y="28.5" width="7" height="3" rx="1" fill="#1d2b6b" />
      {/* leaf accent */}
      <path d="M22 24c4-1 7 1 8 4-3 1-6 0-8-4z" fill="#19a85a" />
      {/* wordmark */}
      <text x="34" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#1d2b6b">
        D
      </text>
      <text x="55" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#19a85a">
        B
      </text>
      <text x="75" y="31" fontFamily="Outfit, Arial, sans-serif" fontWeight="800" fontSize="27" fill="#1d2b6b">
        I
      </text>
      <text x="34" y="46" fontFamily="Outfit, Arial, sans-serif" fontWeight="600" fontSize="7.2" letterSpacing="0.6" fill="#1d2b6b">
        DIGITAL BUSINESS INSTITUTION
      </text>
    </svg>
  );
}
