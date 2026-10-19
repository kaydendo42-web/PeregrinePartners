"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Registers the service worker, and offers to install PeregrineOffice where
 * that makes sense: a one-tap button where the browser can prompt (Android,
 * desktop Chrome and Edge), and the Share → Add to Home Screen steps on
 * iPhone and iPad, where it can't. Says nothing once the app is installed,
 * and nothing again after "Not now".
 */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "po-install-dismissed";

function installed() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function dismissedBefore() {
  try {
    return localStorage.getItem(DISMISSED) === "1";
  } catch {
    return false;
  }
}

/** iPhone or iPad in the browser: the only way in is Share → Add to Home Screen. */
function appleBrowser() {
  if (installed() || dismissedBefore()) return false;
  // iPadOS reports itself as a Mac; touch points give it away.
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

const noSubscribe = () => () => {};

export function InstallHint() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [closed, setClosed] = useState(false);
  // False on the server and during hydration, then the real answer.
  const ios = useSyncExternalStore(noSubscribe, appleBrowser, () => false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!installed() && !dismissedBefore()) setPrompt(e as InstallEvent);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (closed || (!prompt && !ios)) return null;

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  };

  return (
    <div className="mt-[32px] flex items-start gap-[14px] rounded-[16px] bg-white/10 p-[16px] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app/icon-192.png" alt="" width={44} height={44} className="rounded-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="t-body font-medium">Get the PeregrineOffice app</p>
        {prompt ? (
          <p className="t-small mt-[2px] text-white/70">Install it on this device and open your bookings in one tap.</p>
        ) : (
          <p className="t-small mt-[2px] text-white/70">
            Tap <ShareIcon /> Share, then <strong className="font-medium text-white">Add to Home Screen</strong>.
          </p>
        )}
        <div className="mt-[12px] flex gap-[10px]">
          {prompt && (
            <button
              type="button"
              className="min-h-[40px] rounded-[12px] bg-white px-[16px] text-[15px] font-medium text-[#1a1a1a]"
              onClick={async () => {
                await prompt.prompt();
                await prompt.userChoice;
                setPrompt(null);
                setClosed(true);
              }}
            >
              Install
            </button>
          )}
          <button type="button" className="min-h-[40px] rounded-[12px] px-[12px] text-[15px] text-white/70" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-[-2px]"
      aria-hidden="true"
    >
      <path d="M8 10V2M5 5l3-3 3 3M3 8v5.5h10V8" />
    </svg>
  );
}
