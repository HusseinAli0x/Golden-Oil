// Oil tanker truck that drives along the loading progress bar (design/Loading.dc.html).
const metal = "#5A6570";
const dark = "#23303F";
const accent = "#E07B2A";

export function TruckProgress() {
  return (
    <div aria-hidden className="relative h-[46px] w-[340px] max-w-[86vw] overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-1 rounded bg-[rgb(31_41_51/0.12)]" />
      <div className="ld-fill absolute inset-x-0 bottom-0 h-1 rounded bg-accent" />
      <div className="ld-truck absolute bottom-0 start-0 h-10 w-[100px]">
        <svg viewBox="0 0 140 56" width="100" height="40" className="block overflow-visible rtl:-scale-x-100" aria-hidden>
        <g className="ld-speed" stroke={metal} strokeWidth="1.2" strokeLinecap="round">
        <line x1="-14" y1="18" x2="-4" y2="18" />
        <line x1="-20" y1="26" x2="-6" y2="26" />
        <line x1="-12" y1="34" x2="-3" y2="34" />
        </g>
        <ellipse cx="70" cy="52.6" rx="66" ry="2.2" fill="#000000" opacity="0.35" />
        <g className="ld-body">
        <rect x="95.5" y="5" width="2.6" height="31" rx="1" fill={metal} />
        <rect x="95" y="4" width="3.6" height="2.4" rx="0.8" fill={dark} />
        <rect x="95.5" y="5" width="1" height="31" fill="#FFFFFF" opacity="0.35" />
        <rect x="3" y="38" width="96" height="4" rx="1" fill={dark} />
        <rect x="4" y="12" width="88" height="26" rx="13" fill={metal} />
        <rect x="10" y="14.5" width="76" height="4" rx="2" fill="#FFFFFF" opacity="0.45" />
        <rect x="12" y="19.5" width="72" height="1.6" rx="0.8" fill="#FFFFFF" opacity="0.2" />
        <rect x="6" y="30" width="84" height="7.5" rx="3.75" fill="#000000" opacity="0.2" />
        <path d="M17 12.2 A13 13 0 0 0 17 37.8 L13 37.8 A12.8 12.8 0 0 1 13 12.2 Z" fill="#000000" opacity="0.18" />
        <g stroke={dark} strokeWidth="1.1" opacity="0.5">
        <line x1="30" y1="12.4" x2="30" y2="37.6" />
        <line x1="50" y1="12.4" x2="50" y2="37.6" />
        <line x1="70" y1="12.4" x2="70" y2="37.6" />
        </g>
        <rect x="18" y="25" width="62" height="3" fill={accent} />
        <path d="M44 21.5 C44 19.8 45.6 18.5 45.6 18.5 C45.6 18.5 47.2 19.8 47.2 21.5 A1.6 1.6 0 0 1 44 21.5 Z" fill={accent} />
        <g stroke={dark} strokeWidth="0.9" strokeLinecap="round">
        <line x1="16" y1="8.5" x2="82" y2="8.5" />
        <line x1="18" y1="8.5" x2="18" y2="12.3" />
        <line x1="34" y1="8.5" x2="34" y2="12.3" />
        <line x1="50" y1="8.5" x2="50" y2="12.3" />
        <line x1="66" y1="8.5" x2="66" y2="12.3" />
        <line x1="82" y1="8.5" x2="82" y2="12.3" />
        </g>
        <rect x="24" y="9.6" width="8" height="2.6" rx="1" fill={dark} />
        <rect x="56" y="9.6" width="8" height="2.6" rx="1" fill={dark} />
        <g stroke={dark} strokeWidth="0.9" strokeLinecap="round">
        <line x1="2" y1="17" x2="2" y2="38" />
        <line x1="2" y1="21" x2="4.5" y2="21" />
        <line x1="2" y1="26" x2="4.5" y2="26" />
        <line x1="2" y1="31" x2="4.5" y2="31" />
        </g>
        <rect x="44" y="38" width="16" height="4.5" rx="1" fill={dark} />
        <rect x="46" y="39.2" width="12" height="1" fill="#FFFFFF" opacity="0.2" />
        <rect x="3" y="39" width="2.5" height="2" rx="0.6" fill="#E5484D" />
        <rect x="28" y="41" width="1.8" height="8" rx="0.5" fill="#16171A" />
        <rect x="92" y="35.5" width="10" height="4" rx="1" fill={dark} />
        <rect x="92" y="40" width="44" height="3" rx="1" fill={dark} />
        <path d="M99 40 V18 Q99 14 103 14 H117 Q120.5 14 123 17.5 L131 27 Q134.5 28 134.5 31.5 V40 Z" fill={metal} />
        <path d="M99 32 H134.5 V40 H99 Z" fill="#000000" opacity="0.14" />
        <rect x="100" y="15.5" width="16" height="1.4" rx="0.7" fill="#FFFFFF" opacity="0.4" />
        <path d="M118 17 H121 Q122 17 122.8 18 L129.5 27 H118 Z" fill="#1B1D21" />
        <path d="M120 18.5 L125.5 26 L124 26 L119 19.2 Z" fill="#FFFFFF" opacity="0.35" />
        <rect x="104" y="18" width="11" height="9" rx="1.5" fill="#1B1D21" />
        <path d="M106 19.5 L110 19.5 L106 25 Z" fill="#FFFFFF" opacity="0.25" />
        <g stroke={dark} strokeWidth="0.8" opacity="0.6">
        <line x1="102.5" y1="17" x2="102.5" y2="39" />
        <line x1="116.5" y1="17" x2="116.5" y2="39" />
        </g>
        <rect x="112" y="29" width="3" height="1" rx="0.5" fill={dark} />
        <line x1="123" y1="18" x2="125" y2="14.5" stroke={dark} strokeWidth="0.8" />
        <rect x="124.2" y="12" width="2" height="4" rx="0.6" fill={dark} />
        <rect x="131.5" y="31" width="3" height="7" rx="0.6" fill={dark} />
        <g stroke={metal} strokeWidth="0.5" opacity="0.7"><line x1="131.8" y1="33" x2="134.2" y2="33" /><line x1="131.8" y1="35" x2="134.2" y2="35" /></g>
        <rect x="132" y="28.5" width="3" height="2.2" rx="0.8" fill="#FFF4C2" />
        <path d="M135 28.5 L141 26 L141 33 L135 30.7 Z" fill="#FFF4C2" opacity="0.25" />
        <rect x="128" y="40" width="9" height="3.4" rx="1.2" fill={dark} />
        <rect x="104" y="38.5" width="11" height="5" rx="2.5" fill={metal} />
        <rect x="105" y="39.2" width="9" height="1.2" rx="0.6" fill="#FFFFFF" opacity="0.4" />
        <path d="M118 43 A7.5 7.5 0 0 1 133 43" fill="none" stroke={dark} strokeWidth="1.4" />
        </g>
        <g>
        <circle cx="16" cy="46" r="6.5" fill="#16171A" />
        <circle cx="31" cy="46" r="6.5" fill="#16171A" />
        <circle cx="88" cy="46" r="6.5" fill="#16171A" />
        <circle cx="125.5" cy="46" r="6.5" fill="#16171A" />
        </g>
        <g className="ld-wheel"><circle cx="16" cy="46" r="3.8" fill={metal} /><circle cx="16" cy="46" r="1.4" fill={dark} /><g stroke={dark} strokeWidth="0.7"><line x1="16" y1="42.6" x2="16" y2="44.2" /><line x1="16" y1="47.8" x2="16" y2="49.4" /><line x1="12.6" y1="46" x2="14.2" y2="46" /><line x1="17.8" y1="46" x2="19.4" y2="46" /></g></g>
        <g className="ld-wheel"><circle cx="31" cy="46" r="3.8" fill={metal} /><circle cx="31" cy="46" r="1.4" fill={dark} /><g stroke={dark} strokeWidth="0.7"><line x1="31" y1="42.6" x2="31" y2="44.2" /><line x1="31" y1="47.8" x2="31" y2="49.4" /><line x1="27.6" y1="46" x2="29.2" y2="46" /><line x1="32.8" y1="46" x2="34.4" y2="46" /></g></g>
        <g className="ld-wheel"><circle cx="88" cy="46" r="3.8" fill={metal} /><circle cx="88" cy="46" r="1.4" fill={dark} /><g stroke={dark} strokeWidth="0.7"><line x1="88" y1="42.6" x2="88" y2="44.2" /><line x1="88" y1="47.8" x2="88" y2="49.4" /><line x1="84.6" y1="46" x2="86.2" y2="46" /><line x1="89.8" y1="46" x2="91.4" y2="46" /></g></g>
        <g className="ld-wheel"><circle cx="125.5" cy="46" r="3.8" fill={metal} /><circle cx="125.5" cy="46" r="1.4" fill={dark} /><g stroke={dark} strokeWidth="0.7"><line x1="125.5" y1="42.6" x2="125.5" y2="44.2" /><line x1="125.5" y1="47.8" x2="125.5" y2="49.4" /><line x1="122.1" y1="46" x2="123.7" y2="46" /><line x1="127.3" y1="46" x2="128.9" y2="46" /></g></g>
        </svg>
      </div>
    </div>
  );
}
