export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Ambient glow behind the bot */}
      <div className="absolute w-64 h-64 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />

      {/* Bot head */}
      <div className="relative z-10 animate-float">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <line x1="80" y1="12" x2="80" y2="32" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          <circle cx="80" cy="8" r="5" fill="#22d3ee" className="animate-ping-slow" />

          {/* Head shape */}
          <rect x="28" y="32" width="104" height="96" rx="28" fill="#18181b" stroke="#22d3ee" strokeWidth="2.5" />

          {/* Visor / eye band */}
          <rect x="42" y="58" width="76" height="28" rx="14" fill="#0e7490" opacity="0.35" />

          {/* Left eye */}
          <circle cx="60" cy="72" r="10" fill="#22d3ee">
            <animate attributeName="r" values="10;8;10" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="72" r="4" fill="#000" />

          {/* Right eye */}
          <circle cx="100" cy="72" r="10" fill="#22d3ee">
            <animate attributeName="r" values="10;8;10" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="72" r="4" fill="#000" />

          {/* Mouth */}
          <rect x="62" y="100" width="36" height="6" rx="3" fill="#22d3ee" opacity="0.7" />

          {/* Ear bolts */}
          <circle cx="24" cy="76" r="7" fill="#18181b" stroke="#22d3ee" strokeWidth="2" />
          <circle cx="136" cy="76" r="7" fill="#18181b" stroke="#22d3ee" strokeWidth="2" />
        </svg>
      </div>

      {/* App name */}
      <h1 className="relative z-10 mt-8 text-4xl font-bold tracking-widest text-white animate-fade-in">
        ORGANAIZ
      </h1>
      <p className="relative z-10 mt-3 text-sm tracking-wider text-cyan-400/70 animate-fade-in-delayed">
        Stay organized. Stay ahead.
      </p>

      {/* Loading dots */}
      <div className="relative z-10 mt-10 flex gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
