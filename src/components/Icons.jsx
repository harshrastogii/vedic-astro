const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };

export const HomeIcon = () => (<svg {...base}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></svg>);
export const ChartIcon = () => (<svg {...base}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 3l18 18M21 3 3 21M12 3l9 9-9 9-9-9z" /></svg>);
export const DashaIcon = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const PanchangIcon = () => (<svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="12" cy="15.5" r="2" /></svg>);
export const DoshaIcon = () => (<svg {...base}><path d="M12 3 3 19h18L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>);
export const MatchIcon = () => (<svg {...base}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>);
export const ProfilesIcon = () => (<svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>);
export const ChatIcon = () => (<svg {...base}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></svg>);
export const MenuIcon = () => (<svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const PlusIcon = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const ChevronIcon = ({ className }) => (<svg {...base} className={className}><path d="m6 9 6 6 6-6" /></svg>);
export const CheckIcon = () => (<svg {...base}><path d="m5 12 5 5 9-10" /></svg>);
export const XIcon = () => (<svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const SunIcon = () => (<svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const MoonIcon = () => (<svg {...base}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>);
export const PinIcon = () => (<svg {...base}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);

export function Orbit({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="40" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="68" strokeWidth="1.2" strokeDasharray="2 5" />
        <circle cx="100" cy="100" r="94" strokeWidth="1" />
      </g>
      <circle cx="100" cy="100" r="16" fill="currentColor" />
      <circle cx="140" cy="100" r="5" fill="currentColor" />
      <circle cx="52" cy="52" r="4" fill="currentColor" />
      <circle cx="100" cy="194" r="4" fill="currentColor" />
    </svg>
  );
}
