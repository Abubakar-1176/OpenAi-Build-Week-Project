"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Tracks the loader script across multiple map instances on one page, so we
// never inject the Google Maps script more than once.
let loaderPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/**
 * Shows a single marker at the given coordinates. Per the spec this is
 * intentionally basic - no live tracking, routing, or distance calculation.
 * Falls back to a labeled placeholder if no API key is configured, so the
 * app works completely without Google Maps (same fallback pattern as the
 * AI chatbot).
 */
export function LocationMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "no-key">(
    GOOGLE_MAPS_API_KEY ? "loading" : "no-key"
  );

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !containerRef.current) return;

    let cancelled = false;

    loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const position = { lat: latitude, lng: longitude };
        const map = new window.google.maps.Map(containerRef.current, {
          center: position,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new window.google.maps.Marker({ position, map, title: label });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, label]);

  if (status === "no-key" || status === "error") {
    return (
      <div className="flex h-48 items-center justify-center rounded-[var(--radius-card)] border border-border bg-primary-soft/40 text-sm text-muted">
        {status === "error"
          ? "Map couldn't load right now."
          : `Map centered on ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
      </div>
    );
  }

  return (
    <div className="relative h-48 overflow-hidden rounded-[var(--radius-card)] border border-border">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-soft/40 text-sm text-muted">
          Loading map…
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
