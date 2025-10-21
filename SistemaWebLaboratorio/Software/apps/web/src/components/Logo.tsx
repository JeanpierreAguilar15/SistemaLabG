export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path
        d="M9 3h6M10 3v4.586a2 2 0 0 1-.586 1.414L5.757 12.657A4 4 0 0 0 7.586 19h8.828a4 4 0 0 0 1.829-6.343l-3.657-3.657A2 2 0 0 1 14 7.586V3"
        stroke="url(#lg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 15h8" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

