type BrandBirdProps = {
  className?: string;
  title?: string;
};

export function BrandBird({ className = 'h-9 w-9', title = 'MiAsesor' }: BrandBirdProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lotusCore" x1="48" y1="17" x2="48" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7D978" />
          <stop offset="1" stopColor="#E46F17" />
        </linearGradient>
        <linearGradient id="lotusTeal" x1="20" y1="39" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#17B8C8" />
          <stop offset="1" stopColor="#006D77" />
        </linearGradient>
        <linearGradient id="lotusInk" x1="18" y1="18" x2="78" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#24323A" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <filter id="lotusShadow" x="0" y="0" width="96" height="96" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1F2937" floodOpacity="0.16" />
        </filter>
      </defs>

      <g filter="url(#lotusShadow)">
        <path
          d="M48 8.5c9.9 8.5 16.1 19.2 16.1 31.1 0 12.2-6.1 21.1-16.1 29-10-7.9-16.1-16.8-16.1-29C31.9 27.7 38.1 17 48 8.5Z"
          fill="#FFF7D7"
          stroke="url(#lotusInk)"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M48 15.9c6.9 7.1 10.6 14.8 10.6 23.3 0 8.9-3.8 15.7-10.6 22.1-6.8-6.4-10.6-13.2-10.6-22.1 0-8.5 3.7-16.2 10.6-23.3Z"
          fill="url(#lotusCore)"
        />

        <path
          d="M19.8 36.1c12.5.6 23 5.6 30.2 14.6 7.4 9.3 9 19.6 5.5 31.4-12.3-2.1-21.7-7.4-29.1-16.7-7.2-9-9.8-18.9-6.6-29.3Z"
          fill="#EAFBFB"
          stroke="url(#lotusInk)"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M76.2 36.1c-12.5.6-23 5.6-30.2 14.6-7.4 9.3-9 19.6-5.5 31.4 12.3-2.1 21.7-7.4 29.1-16.7 7.2-9 9.8-18.9 6.6-29.3Z"
          fill="#EAFBFB"
          stroke="url(#lotusInk)"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M25.5 42.1c9.2 1.8 16.6 6.3 22.1 13.2 5.2 6.5 7.1 13.6 5.9 21.5-8.3-2.2-15.2-6.5-20.5-13.1-5.5-6.9-8-14.1-7.5-21.6Z"
          fill="url(#lotusTeal)"
          opacity="0.92"
        />
        <path
          d="M70.5 42.1c-9.2 1.8-16.6 6.3-22.1 13.2-5.2 6.5-7.1 13.6-5.9 21.5 8.3-2.2 15.2-6.5 20.5-13.1 5.5-6.9 8-14.1 7.5-21.6Z"
          fill="url(#lotusTeal)"
          opacity="0.92"
        />

        <path
          d="M48 47.6c7.7 6.7 12 14.4 12 23.1 0 4.5-1.2 8.8-3.5 12.8H39.5C37.2 79.5 36 75.2 36 70.7c0-8.7 4.3-16.4 12-23.1Z"
          fill="#FFFDF4"
          stroke="url(#lotusInk)"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M48 54.1c4.7 5 7.2 10.4 7.2 16.4 0 3-.6 5.8-1.9 8.4H42.7a18.4 18.4 0 0 1-1.9-8.4c0-6 2.5-11.4 7.2-16.4Z"
          fill="url(#lotusCore)"
        />

        <path
          d="M14.4 72.4c9.2 6.1 20.4 9.7 33.6 9.7s24.4-3.6 33.6-9.7"
          stroke="url(#lotusInk)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M24.4 78.8c6.7 5.1 14.6 7.7 23.6 7.7s16.9-2.6 23.6-7.7"
          stroke="#E46F17"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="48" cy="39.2" r="3.5" fill="#111827" />
        <circle cx="48" cy="39.2" r="1.35" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
