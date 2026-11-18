const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true };

export const HomeIcon = () => (<svg {...base}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></svg>);
export const ChartIcon = () => (<svg {...base}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 3l18 18M21 3 3 21M12 3l9 9-9 9-9-9z" /></svg>);
export const DashaIcon = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const PanchangIcon = () => (<svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="12" cy="15.5" r="2" /></svg>);
export const DoshaIcon = () => (<svg {...base}><path d="M12 3 3 19h18L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>);
export const MatchIcon = () => (<svg {...base}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>);
export const ProfilesIcon = () => (<svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>);
export const ChatIcon = () => (<svg {...base}><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" /><path d="M8.5 10.5h7M8.5 13.5h4" /></svg>);
export const MenuIcon = () => (<svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const PlusIcon = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const ChevronIcon = ({ className }) => (<svg {...base} className={className}><path d="m6 9 6 6 6-6" /></svg>);
export const ArrowRightIcon = () => (<svg {...base}><path d="m9 6 6 6-6 6" /></svg>);
export const ArrowUpIcon = () => (<svg {...base}><path d="M12 19V5M6 11l6-6 6 6" /></svg>);
export const CheckIcon = () => (<svg {...base}><path d="m5 12 5 5 9-10" /></svg>);
export const XIcon = () => (<svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const TrashIcon = () => (<svg {...base}><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" /></svg>);
export const SunIcon = () => (<svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const MoonIcon = () => (<svg {...base}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>);
export const MoonStarIcon = () => (<svg {...base}><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" /><path d="M17 3v4M15 5h4" /></svg>);
export const PinIcon = () => (<svg {...base}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const CalendarIcon = () => (<svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>);
export const ClockIcon = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const SparkIcon = () => (<svg {...base}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>);
export const CompassIcon = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>);
export const WheelIcon = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6" /></svg>);
export const HourglassIcon = () => (<svg {...base}><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" /></svg>);
export const TimerIcon = () => (<svg {...base}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>);
export const HouseSmIcon = () => (<svg {...base}><path d="M4 11 12 4l8 7v9H4z" /></svg>);
export const BookIcon = () => (<svg {...base}><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v17H5.5A2.5 2.5 0 0 0 3 22.5zM21 5.5A2.5 2.5 0 0 0 18.5 3H13v17h5.5a2.5 2.5 0 0 1 2.5 2.5z" /></svg>);
export const RetroIcon = () => (<svg {...base}><path d="M4 12a8 8 0 1 0 2.3-5.6" /><path d="M4 4v4h4" /></svg>);
export const BriefcaseIcon = () => (<svg {...base}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>);

export const GemIcon = () => (<svg {...base}><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18M9 3l3 6 3-6M12 21 9 9M12 21l3-12" /></svg>);
export const CrownIcon = () => (<svg {...base}><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z" /><path d="M5 19h14" /></svg>);
export const PlaneIcon = () => (<svg {...base}><path d="M10.5 13.5 3 11l1.5-1.5 7.5 1L16.5 6A2 2 0 0 1 19.3 8.8L14.5 13.5l1 7.5L14 22.5l-2.5-7.5-3 3V21l-1.5 1.5-1-3.5-3.5-1L4 16.5h2.5l3-3" /></svg>);
export const ReportIcon = () => (<svg {...base}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 12h6M10 16h6" /></svg>);

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
