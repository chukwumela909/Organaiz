"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallScreenInner() {
  const searchParams = useSearchParams();
  const caller = searchParams.get("caller") || "Unknown";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"ringing" | "accepted" | "declined">("ringing");
  const [elapsed, setElapsed] = useState(0);

  // Play ringtone on mount
  useEffect(() => {
    if (status !== "ringing") return;

    const audio = new Audio("/ringtone.wav");
    audio.loop = true;
    audio.volume = 1.0;
    audioRef.current = audio;

    // Browsers may block autoplay — we try immediately
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — will play on first user interaction
        const unlock = () => {
          audio.play().catch(() => {});
          document.removeEventListener("touchstart", unlock);
          document.removeEventListener("click", unlock);
        };
        document.addEventListener("touchstart", unlock, { once: true });
        document.addEventListener("click", unlock, { once: true });
      });
    }

    // Vibrate pattern: phone ring style (Android only)
    if ("vibrate" in navigator) {
      const vibrateLoop = () => {
        if (status === "ringing") {
          navigator.vibrate([800, 400, 800, 400, 800, 1200]);
        }
      };
      vibrateLoop();
      const vibrateInterval = setInterval(vibrateLoop, 4000);
      return () => {
        clearInterval(vibrateInterval);
        navigator.vibrate(0);
        audio.pause();
        audio.currentTime = 0;
      };
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [status]);

  // Timer when accepted
  useEffect(() => {
    if (status !== "accepted") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAccept = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigator.vibrate?.(0);
    setStatus("accepted");
  }, []);

  const handleDecline = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigator.vibrate?.(0);
    setStatus("declined");

    // Go back or close after a beat
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/";
      }
    }, 600);
  }, []);

  const handleEndCall = useCallback(() => {
    setStatus("declined");
    setTimeout(() => {
      window.location.href = "/";
    }, 400);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black px-6 py-12 text-white select-none">
      {/* Top section — caller info */}
      <div className="flex flex-col items-center gap-4 pt-8">
        {/* Avatar pulse ring */}
        <div className="relative flex items-center justify-center">
          {status === "ringing" && (
            <>
              <span className="absolute h-28 w-28 animate-ping rounded-full bg-emerald-500/20" />
              <span className="absolute h-24 w-24 animate-pulse rounded-full bg-emerald-500/30" />
            </>
          )}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-white ring-2 ring-zinc-700">
            {caller.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{caller}</h1>
          <p className="text-sm text-zinc-400">
            {status === "ringing" && "Incoming call..."}
            {status === "accepted" && formatTime(elapsed)}
            {status === "declined" && "Call ended"}
          </p>
        </div>

        {/* Status indicator */}
        {status === "ringing" && (
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {/* Bottom section — action buttons */}
      <div className="pb-12 w-full max-w-xs">
        {status === "ringing" && (
          <div className="flex items-center justify-between px-8">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 transition-transform active:scale-90"
                aria-label="Decline call"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7 rotate-[135deg]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
              <span className="text-xs text-zinc-400">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/30 transition-transform active:scale-90 animate-pulse"
                aria-label="Accept call"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
              <span className="text-xs text-zinc-400">Accept</span>
            </div>
          </div>
        )}

        {status === "accepted" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>
            <button
              onClick={handleEndCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 transition-transform active:scale-90"
              aria-label="End call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7 rotate-[135deg]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-lg">Connecting...</div>
      </div>
    }>
      <CallScreenInner />
    </Suspense>
  );
}
