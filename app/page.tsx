"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Screen = "home" | "route" | "pass" | "ride" | "history" | "settings";
type MapView = "korea" | "incheon" | "asia";

type Route = {
  id: string;
  line: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  minutes: number;
  stops: number;
  distance: string;
};

type SessionLog = {
  task: string;
  route: string;
  minutes: number;
  completedAt: string;
};

type Settings = {
  masterVolume: number;
  alarmEnabled: boolean;
  soundEnabled: boolean;
  openMusicInNewTab: boolean;
  focusLabel: string;
};

type CameraConfig = {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

type StationMarker = {
  code: string;
  name: string;
  coordinates: [number, number];
  labelOffset: [number, number];
};

const ROUTES: Route[] = [
  {
    id: "inu-tnp",
    line: "Incheon Line 1",
    fromCode: "INU",
    fromName: "Incheon Nat’l Univ.",
    toCode: "TNP",
    toName: "Technopark",
    minutes: 3,
    stops: 1,
    distance: "2.1 km",
  },
  {
    id: "tnp-inu",
    line: "Incheon Line 1",
    fromCode: "TNP",
    fromName: "Technopark",
    toCode: "INU",
    toName: "Incheon Nat’l Univ.",
    minutes: 3,
    stops: 1,
    distance: "2.1 km",
  },
  {
    id: "cpk-ctn",
    line: "Incheon Line 1",
    fromCode: "CPK",
    fromName: "Central Park",
    toCode: "CTN",
    toName: "Campus Town",
    minutes: 6,
    stops: 3,
    distance: "4.2 km",
  },
];

const STATION_MARKERS: StationMarker[] = [
  {
    code: "CPK",
    name: "Central Park",
    coordinates: [126.6345, 37.3927],
    labelOffset: [0, -8],
  },
  {
    code: "INU",
    name: "Incheon Nat’l Univ.",
    coordinates: [126.6349, 37.3861],
    labelOffset: [0, -8],
  },
  {
    code: "TNP",
    name: "Technopark",
    coordinates: [126.6565, 37.3826],
    labelOffset: [0, -8],
  },
  {
    code: "CTN",
    name: "Campus Town",
    coordinates: [126.6615, 37.3881],
    labelOffset: [0, -8],
  },
];

const STORAGE_KEY = "subway-study-logs-final-v24";
const SETTINGS_KEY = "subway-study-settings-final-v24";

const YOUTUBE_STUDY_MUSIC_URL =
  "https://www.youtube.com/watch?v=MYPVQccHhAQ";

const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.5,
  alarmEnabled: true,
  soundEnabled: true,
  openMusicInNewTab: true,
  focusLabel: "Deep Study",
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function getCamera(view: MapView, routePage = false): CameraConfig {
  if (view === "korea") {
    return {
      center: [127.8, 36.1],
      zoom: 5.7,
      pitch: 0,
      bearing: 0,
      padding: {
        top: 190,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };
  }

  if (view === "incheon") {
    if (routePage) {
      return {
        center: [126.651, 37.389],
        zoom: 13.65,
        pitch: 28,
        bearing: -14,
        padding: {
          top: 0,
          right: 0,
          bottom: 20,
          left: 0,
        },
      };
    }

    return {
      center: [126.651, 37.3868],
      zoom: 13.35,
      pitch: 28,
      bearing: -14,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };
  }

  return {
    center: [122.5, 34.8],
    zoom: 4.25,
    pitch: 0,
    bearing: 0,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };
}

function getAudioContext(): AudioContext | null {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

function useAlarmSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  const ensureContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = getAudioContext();
    }

    if (contextRef.current?.state === "suspended") {
      contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current !== null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    const context = contextRef.current;

    if (context && alarmGainRef.current) {
      alarmGainRef.current.gain.setTargetAtTime(0, context.currentTime, 0.03);
    }

    alarmGainRef.current = null;
  }, []);

  const playOneBeep = useCallback(
    (volume: number) => {
      const context = ensureContext();
      if (!context) return;

      const masterGain = context.createGain();
      masterGain.gain.value = Math.max(0.05, Math.min(0.9, volume));
      masterGain.connect(context.destination);

      const now = context.currentTime;

      [784, 988].forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = "sine";
        osc.frequency.value = frequency;

        const start = now + index * 0.16;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.75, start + 0.03);
        gain.gain.linearRampToValueAtTime(0, start + 0.32);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(start);
        osc.stop(start + 0.35);
      });

      window.setTimeout(() => {
        try {
          masterGain.disconnect();
        } catch {}
      }, 900);
    },
    [ensureContext],
  );

  const startAlarm = useCallback(
    (volume: number) => {
      stopAlarm();

      const context = ensureContext();
      if (!context) return;

      const alarmGain = context.createGain();
      alarmGain.gain.value = Math.max(0.06, Math.min(0.9, volume));
      alarmGain.connect(context.destination);
      alarmGainRef.current = alarmGain;

      const beep = () => {
        const now = context.currentTime;

        [784, 988].forEach((frequency, index) => {
          const osc = context.createOscillator();
          const gain = context.createGain();

          osc.type = "sine";
          osc.frequency.value = frequency;

          const start = now + index * 0.18;

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.85, start + 0.03);
          gain.gain.linearRampToValueAtTime(0, start + 0.38);

          osc.connect(gain);
          gain.connect(alarmGain);

          osc.start(start);
          osc.stop(start + 0.4);
        });
      };

      beep();
      alarmIntervalRef.current = window.setInterval(beep, 1200);
    },
    [ensureContext, stopAlarm],
  );

  useEffect(() => {
    return () => {
      stopAlarm();
      contextRef.current?.close();
    };
  }, [stopAlarm]);

  return { startAlarm, stopAlarm, playOneBeep };
}

const MapBackground = memo(function MapBackground({
  view,
  blurred = false,
  routePage = false,
  routeBright = false,
  showStationMarkers = false,
}: {
  view: MapView;
  blurred?: boolean;
  routePage?: boolean;
  routeBright?: boolean;
  showStationMarkers?: boolean;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const camera = useMemo(() => getCamera(view, routePage), [view, routePage]);

  useEffect(() => {
    if (!mapDivRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      setError("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      antialias: true,
      fadeDuration: 0,
      attributionControl: true,
      interactive: true,
      projection: "mercator",
    });

    mapRef.current = map;

    map.on("load", () => {
      setReady(true);
      setError("");

      map.setProjection("mercator");

      map.jumpTo({
        center: camera.center,
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: camera.bearing,
        padding: camera.padding,
      });

      map.resize();
    });

    map.on("error", () => {
      setError("Mapbox failed to load. Check your token and internet.");
    });

    const resize = () => map.resize();

    const timers = [
      window.setTimeout(resize, 100),
      window.setTimeout(resize, 500),
      window.setTimeout(resize, 1000),
      window.setTimeout(resize, 1800),
    ];

    window.addEventListener("resize", resize);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [camera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      padding: camera.padding,
      duration: 750,
      essential: true,
    });

    window.setTimeout(() => map.resize(), 150);
  }, [camera, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!showStationMarkers || view !== "incheon") return;

    const newMarkers = STATION_MARKERS.map((station) => {
      const markerElement = document.createElement("div");
      const [offsetX, offsetY] = station.labelOffset;

      markerElement.className = "station-marker pointer-events-none";
      markerElement.innerHTML = `
        <div style="position: relative; width: 0; height: 0;">
          <div
            style="
              position: absolute;
              left: 0px;
              top: 0px;
              width: 13px;
              height: 13px;
              border-radius: 9999px;
              border: 2px solid white;
              background: #facc15;
              box-shadow: 0 0 18px rgba(250,204,21,1);
              transform: translate(-50%, -50%);
            "
          ></div>

          <div
            style="
              position: absolute;
              left: ${offsetX}px;
              top: ${offsetY}px;
              transform: translate(-50%, -100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              white-space: nowrap;
            "
          >
            <div
              style="
                border-radius: 9999px;
                border: 2px solid #facc15;
                background: rgba(0,0,0,0.92);
                padding: 5px 12px;
                font-size: 12px;
                font-weight: 900;
                letter-spacing: 0.04em;
                color: white;
                box-shadow: 0 0 18px rgba(0,0,0,0.9);
                backdrop-filter: blur(8px);
              "
            >
              ${station.code}
            </div>

            <div
              style="
                margin-top: 5px;
                border-radius: 9999px;
                background: rgba(255,255,255,0.97);
                padding: 5px 12px;
                font-size: 10px;
                font-weight: 900;
                color: black;
                box-shadow: 0 0 15px rgba(0,0,0,0.8);
              "
            >
              ${station.name}
            </div>
          </div>
        </div>
      `;

      return new mapboxgl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(station.coordinates)
        .addTo(map);
    });

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((marker) => marker.remove());
    };
  }, [ready, showStationMarkers, view]);

  return (
    <>
      <div className="absolute inset-0 bg-black" />

      <div
        ref={mapDivRef}
        className={`absolute inset-0 h-screen w-screen transition-opacity duration-700 ${
          blurred ? "scale-[1.04] blur-[1.3px]" : ""
        } ${
          routeBright ? "brightness-[1.08] saturate-[1.05] contrast-[1.01]" : ""
        } ${ready ? "opacity-100" : "opacity-0"}`}
      />

      {blurred ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/42" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.18)_36%,rgba(0,0,0,0.56)_78%,rgba(0,0,0,0.82)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.24),rgba(0,0,0,0.50))]" />
        </>
      ) : routeBright ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/8" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.03)_42%,rgba(0,0,0,0.20)_82%,rgba(0,0,0,0.42)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.50)_0%,rgba(0,0,0,0.28)_18%,rgba(0,0,0,0.08)_42%,transparent_68%)]" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.03)_40%,rgba(0,0,0,0.24)_82%,rgba(0,0,0,0.50)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.46)_0%,rgba(0,0,0,0.24)_18%,rgba(0,0,0,0.07)_42%,transparent_68%)]" />
        </>
      )}

      {error && (
        <div className="absolute right-6 top-24 z-50 max-w-sm rounded-2xl border border-red-400/30 bg-red-950/85 p-4 text-sm text-red-100 backdrop-blur-xl">
          <p className="font-bold">Mapbox is not loading</p>
          <p className="mt-1 text-red-100/80">{error}</p>
        </div>
      )}

      <style jsx global>{`
        .mapboxgl-map,
        .mapboxgl-canvas-container,
        .mapboxgl-canvas {
          width: 100% !important;
          height: 100% !important;
        }

        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          opacity: 0.25;
        }

        .mapboxgl-marker {
          z-index: 12;
        }
      `}</style>
    </>
  );
});

function MacDots() {
  return (
    <div className="fixed left-5 top-5 z-50 flex gap-2">
      <span className="h-3.5 w-3.5 rounded-full bg-red-500" />
      <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
      <span className="h-3.5 w-3.5 rounded-full bg-emerald-400" />
    </div>
  );
}

function TopPill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-white/15 bg-black/45 px-5 py-2.5 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function AppShell({
  children,
  view,
  screen,
  setScreen,
  blurred = false,
  routePage = false,
  routeBright = false,
  showStationMarkers = false,
}: {
  children: React.ReactNode;
  view: MapView;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  blurred?: boolean;
  routePage?: boolean;
  routeBright?: boolean;
  showStationMarkers?: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <MapBackground
        view={view}
        blurred={blurred}
        routePage={routePage}
        routeBright={routeBright}
        showStationMarkers={showStationMarkers}
      />

      <MacDots />

      {screen !== "home" && (
        <div className="fixed left-24 top-4 z-50">
          <TopPill onClick={() => setScreen("home")}>Home</TopPill>
        </div>
      )}

      <div className="fixed right-6 top-4 z-50">
        <TopPill onClick={() => setScreen("home")}>Subway Study</TopPill>
      </div>

      <div className="relative z-20 min-h-screen">{children}</div>
    </main>
  );
}

function ToggleCard({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        enabled
          ? "border-blue-400 bg-blue-500/20"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-black">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
            enabled ? "bg-blue-500" : "bg-white/20"
          }`}
        >
          <div
            className={`h-5 w-5 rounded-full bg-white transition ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function RouteSelectionScreen({
  selectedRoute,
  selectedRouteId,
  setSelectedRouteId,
  onContinue,
}: {
  selectedRoute: Route;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20">
      <div className="absolute left-8 top-[13vh] max-w-3xl">
        <h1 className="text-6xl font-black leading-[0.96] tracking-tight text-white drop-shadow-[0_5px_20px_rgba(0,0,0,1)]">
          Select your subway route.
        </h1>

        <p className="mt-4 max-w-xl text-lg font-medium text-white/85 drop-shadow-[0_3px_12px_rgba(0,0,0,1)]">
          Choose a focused study ride and continue to your boarding pass.
        </p>
      </div>

      <div className="absolute bottom-9 left-1/2 w-[700px] max-w-[82vw] -translate-x-1/2">
        <div className="mx-auto mb-4 flex w-fit items-center gap-4 rounded-full border border-white/15 bg-black/65 px-5 py-3 shadow-2xl backdrop-blur-2xl">
          <span className="text-xs uppercase tracking-[0.25em] text-blue-300">
            Selected
          </span>

          <span className="text-lg font-black text-white">
            {selectedRoute.fromCode} → {selectedRoute.toCode}
          </span>

          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/80">
            {selectedRoute.minutes} min
          </span>

          <span className="text-sm text-white/50">
            {selectedRoute.distance}
          </span>
        </div>

        <div className="mx-auto mb-4 w-[520px] max-w-[75vw]">
          <div className="relative h-10">
            <div className="absolute left-0 right-0 top-6 h-[2px] bg-white/35" />

            <div className="absolute left-0 right-0 top-6 flex -translate-y-1/2 justify-between">
              {Array.from({ length: 45 }).map((_, index) => {
                const major = index % 10 === 0;

                return (
                  <div
                    key={index}
                    className={`w-px bg-white/70 ${major ? "h-7" : "h-3"}`}
                  />
                );
              })}
            </div>

            <div className="absolute left-0 top-0 text-sm font-black text-white">
              3m
            </div>

            <div className="absolute left-[33%] top-0 text-sm font-black text-white/85">
              4m
            </div>

            <div className="absolute left-[66%] top-0 text-sm font-black text-white/85">
              5m
            </div>

            <div className="absolute right-0 top-0 text-sm font-black text-white/55">
              6m
            </div>

            <div className="absolute -top-1 left-0 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {ROUTES.map((route) => {
            const active = route.id === selectedRouteId;

            return (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`rounded-[1.35rem] p-4 text-left shadow-2xl backdrop-blur-2xl transition-all duration-200 ${
                  active
                    ? "bg-white text-black shadow-white/20"
                    : "border border-white/10 bg-black/70 text-white hover:bg-black/80"
                }`}
              >
                <div
                  className={`mb-3 inline-flex rounded-lg border-2 px-3 py-1 text-xs font-black ${
                    active
                      ? "border-black bg-yellow-300 text-black"
                      : "border-yellow-300 text-yellow-300"
                  }`}
                >
                  🚇 {route.toCode}
                </div>

                <p className="text-lg font-black leading-tight">
                  {route.toName}
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    active ? "text-black/55" : "text-white/55"
                  }`}
                >
                  {route.minutes}m · {route.distance}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={onContinue}
          className="w-full rounded-full bg-white px-8 py-4 text-lg font-black text-black shadow-[0_10px_40px_rgba(255,255,255,0.18)] transition hover:scale-[1.01]"
        >
          Generate Boarding Pass
        </button>
      </div>
    </div>
  );
}

function BoardingPass({
  selectedRoute,
  minutes,
  focusLabel,
  onStart,
}: {
  selectedRoute: Route;
  minutes: number;
  focusLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-28">
      <div className="w-full">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">
            Study ride pass.
          </h1>
        </div>

        <div className="mt-8 rounded-[3rem] border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="rounded-[2rem] border border-white/15 bg-black/50 p-8">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{selectedRoute.line}</p>
                <p className="text-sm text-slate-500">SUBWAY STUDY PASS</p>
              </div>

              <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Study Ride
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div>
                <p className="text-7xl font-black">{selectedRoute.fromCode}</p>
                <p className="mt-2 text-slate-400">{selectedRoute.fromName}</p>
              </div>

              <p className="text-5xl text-slate-500">→</p>

              <div className="text-right">
                <p className="text-7xl font-black">{selectedRoute.toCode}</p>
                <p className="mt-2 text-slate-400">{selectedRoute.toName}</p>
              </div>
            </div>

            <div className="my-8 grid grid-cols-4 gap-4 border-y border-dashed border-white/15 py-6">
              <div>
                <p className="text-xs text-slate-500">Focus</p>
                <p className="mt-1 font-bold">{focusLabel || "Deep Study"}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="mt-1 font-bold">{minutes} min</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Stops</p>
                <p className="mt-1 font-bold">{selectedRoute.stops}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Distance</p>
                <p className="mt-1 font-bold">{selectedRoute.distance}</p>
              </div>
            </div>

            <div className="mx-auto flex h-24 max-w-sm items-center justify-center rounded-2xl bg-white p-3">
              <div className="h-full w-full bg-[repeating-linear-gradient(90deg,#111_0px,#111_3px,#fff_3px,#fff_8px,#111_8px,#111_13px,#fff_13px,#fff_20px)]" />
            </div>
          </div>

          <button
            onClick={onStart}
            className="mt-6 w-full rounded-full bg-white px-8 py-5 text-lg font-black text-black transition hover:scale-[1.01]"
          >
            Check in
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveRideContent({
  selectedRoute,
  secondsLeft,
  progress,
  running,
  focusLabel,
  onPause,
  onResume,
  onReset,
  onHistory,
  onSettings,
  onOpenMusic,
}: {
  selectedRoute: Route;
  secondsLeft: number;
  progress: number;
  running: boolean;
  focusLabel: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onOpenMusic: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-[1120px]">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black tracking-tight">
            Live study ride<span className="text-blue-400">.</span>
          </h1>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-[3rem] border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-8 flex items-center justify-between gap-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-blue-200/80">
                  Current route
                </p>

                <h2 className="mt-3 text-5xl font-black tracking-tight">
                  {selectedRoute.fromCode} → {selectedRoute.toCode}
                </h2>

                <p className="mt-2 text-lg text-slate-300">
                  {selectedRoute.fromName} → {selectedRoute.toName}
                </p>
              </div>

              <div className="rounded-3xl bg-blue-500 px-7 py-5 text-center shadow-[0_0_35px_rgba(59,130,246,0.45)]">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-100">
                  Timer
                </p>

                <p className="mt-1 text-4xl font-black">
                  {formatTime(secondsLeft)}
                </p>
              </div>
            </div>

            <div className="h-3 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.85)] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-blue-200/80">Focus</p>
                <p className="mt-3 text-xl font-bold">
                  {focusLabel || "Deep Study"}
                </p>
              </div>

              <button
                onClick={onOpenMusic}
                className="rounded-2xl border border-blue-400 bg-blue-500/20 p-5 text-left transition hover:bg-blue-500/30"
              >
                <p className="text-xs text-blue-200/80">Music</p>
                <p className="mt-3 text-xl font-bold">YouTube</p>
                <p className="mt-1 text-sm text-slate-300">
                  Open study video
                </p>
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-blue-200/80">Distance</p>
                <p className="mt-3 text-xl font-bold">
                  {selectedRoute.distance}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[3rem] border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-blue-200/80">
              Controls
            </p>

            <div className="mt-7 grid grid-cols-2 gap-4">
              {running ? (
                <button
                  onClick={onPause}
                  className="rounded-2xl bg-yellow-300 px-6 py-5 text-lg font-black text-black shadow-lg hover:bg-yellow-200"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="rounded-2xl bg-blue-500 px-6 py-5 text-lg font-black text-white shadow-lg hover:bg-blue-400"
                >
                  Start
                </button>
              )}

              <button
                onClick={onReset}
                className="rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-lg font-black text-white hover:bg-white/15"
              >
                Reset
              </button>
            </div>

            <button
              onClick={onHistory}
              className="mt-6 w-full rounded-2xl bg-white px-6 py-5 text-lg font-black text-black"
            >
              View History
            </button>

            <button
              onClick={onSettings}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-lg font-black text-white hover:bg-white/15"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({
  settings,
  updateSettings,
  onPreviewAlarm,
  onClearHistory,
  logsCount,
}: {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  onPreviewAlarm: () => void;
  onClearHistory: () => void;
  logsCount: number;
}) {
  return (
    <div className="flex min-h-screen max-w-4xl flex-col justify-center px-8 py-24">
      <h1 className="text-5xl font-black tracking-tight">Settings.</h1>

      <div className="mt-8 space-y-5 rounded-[3rem] border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-2xl">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-black">Volume</p>
              <p className="mt-1 text-sm text-slate-400">
                Controls the app alarm and preview sound.
              </p>
            </div>

            <p className="font-mono text-lg font-black">
              {Math.round(settings.masterVolume * 100)}%
            </p>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.masterVolume}
            onChange={(event) =>
              updateSettings({ masterVolume: Number(event.target.value) })
            }
            className="mt-5 w-full accent-blue-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleCard
            title="App sound"
            description={
              settings.soundEnabled
                ? "Sound effects are enabled."
                : "Sound effects are muted."
            }
            enabled={settings.soundEnabled}
            onClick={() =>
              updateSettings({ soundEnabled: !settings.soundEnabled })
            }
          />

          <ToggleCard
            title="End alarm"
            description={
              settings.alarmEnabled
                ? "Alarm rings when the timer ends."
                : "Timer ends silently."
            }
            enabled={settings.alarmEnabled}
            onClick={() =>
              updateSettings({ alarmEnabled: !settings.alarmEnabled })
            }
          />
        </div>

        <div>
          <p className="text-xl font-black">Focus label</p>
          <p className="mt-1 text-sm text-slate-400">
            This appears on the boarding pass and timer page.
          </p>

          <input
            value={settings.focusLabel}
            onChange={(event) =>
              updateSettings({ focusLabel: event.target.value })
            }
            placeholder="Deep Study"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={onPreviewAlarm}
            className="rounded-2xl bg-blue-500 px-6 py-5 text-lg font-black text-white transition hover:bg-blue-400"
          >
            Preview Alarm
          </button>

          <ToggleCard
            title="YouTube tab"
            description={
              settings.openMusicInNewTab
                ? "Music opens in a new tab."
                : "Music opens in the same tab."
            }
            enabled={settings.openMusicInNewTab}
            onClick={() =>
              updateSettings({
                openMusicInNewTab: !settings.openMusicInNewTab,
              })
            }
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-black">Study history</p>
              <p className="mt-1 text-sm text-slate-400">
                {logsCount} saved ride{logsCount === 1 ? "" : "s"}.
              </p>
            </div>

            <button
              onClick={onClearHistory}
              className="rounded-2xl border border-red-400/40 bg-red-500/15 px-5 py-3 font-black text-red-100 transition hover:bg-red-500/25"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedRouteId, setSelectedRouteId] = useState(ROUTES[0].id);
  const [minutes, setMinutes] = useState(ROUTES[0].minutes);
  const [secondsLeft, setSecondsLeft] = useState(ROUTES[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [alarmActive, setAlarmActive] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { startAlarm, stopAlarm, playOneBeep } = useAlarmSound();

  const selectedRoute =
    ROUTES.find((route) => route.id === selectedRouteId) || ROUTES[0];

  const progress =
    minutes > 0 ? ((minutes * 60 - secondsLeft) / (minutes * 60)) * 100 : 0;

  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch {}
    }

    if (savedSettings) {
      try {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(savedSettings),
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    setMinutes(selectedRoute.minutes);
    setSecondsLeft(selectedRoute.minutes * 60);
    setRunning(false);
    setAlarmActive(false);
    stopAlarm();
  }, [selectedRoute.id, selectedRoute.minutes, stopAlarm]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) return 0;
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft !== 0) return;

    setRunning(false);

    const newLog: SessionLog = {
      task: settings.focusLabel || "Deep Study",
      route: `${selectedRoute.fromCode} → ${selectedRoute.toCode}`,
      minutes,
      completedAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setLogs((previous) => [newLog, ...previous]);
    setAlarmActive(true);

    if (settings.soundEnabled && settings.alarmEnabled) {
      startAlarm(settings.masterVolume);
    }
  }, [
    running,
    secondsLeft,
    selectedRoute,
    minutes,
    settings.focusLabel,
    settings.soundEnabled,
    settings.alarmEnabled,
    settings.masterVolume,
    startAlarm,
  ]);

  function updateSettings(patch: Partial<Settings>) {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  }

  function openYouTubeMusic() {
    if (settings.openMusicInNewTab) {
      window.open(YOUTUBE_STUDY_MUSIC_URL, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = YOUTUBE_STUDY_MUSIC_URL;
    }
  }

  function startRide() {
    setSecondsLeft(minutes * 60);
    setRunning(true);
    setAlarmActive(false);
    stopAlarm();
    setScreen("ride");
  }

  function pauseRide() {
    setRunning(false);
  }

  function resumeRide() {
    if (secondsLeft > 0) setRunning(true);
  }

  function resetRide() {
    setRunning(false);
    setSecondsLeft(minutes * 60);
    setAlarmActive(false);
    stopAlarm();
  }

  function stopCurrentAlarm() {
    setAlarmActive(false);
    stopAlarm();
  }

  function previewAlarm() {
    if (settings.soundEnabled) {
      playOneBeep(settings.masterVolume);
    }
  }

  function clearHistory() {
    setLogs([]);
  }

  if (screen === "home") {
    return (
      <AppShell view="korea" screen={screen} setScreen={setScreen}>
        <div className="flex min-h-screen items-end px-6 pb-10">
          <div className="w-full max-w-xl">
            <p className="text-2xl font-bold text-white/70 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]">
              Your study route is ready.
            </p>

            <h1 className="mt-2 text-6xl font-black tracking-tight text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.95)] md:text-7xl">
              Begin your subway study ride.
            </h1>

            <button
              onClick={() => setScreen("route")}
              className="mt-72 w-full max-w-sm rounded-full bg-white px-8 py-5 text-lg font-black text-black shadow-2xl transition hover:scale-[1.02]"
            >
              Start Journey
            </button>

            <div className="mt-5 w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/15 bg-black/40 text-lg font-bold backdrop-blur-2xl">
              <button
                onClick={() => setScreen("ride")}
                className="block w-full border-b border-white/10 px-5 py-4 text-left hover:bg-white/10"
              >
                In Progress
              </button>

              <button
                onClick={() => setScreen("history")}
                className="block w-full border-b border-white/10 px-5 py-4 text-left hover:bg-white/10"
              >
                History
              </button>

              <button
                onClick={() => setScreen("route")}
                className="block w-full border-b border-white/10 px-5 py-4 text-left hover:bg-white/10"
              >
                Routes
              </button>

              <button
                onClick={() => setScreen("settings")}
                className="block w-full px-5 py-4 text-left hover:bg-white/10"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (screen === "route") {
    return (
      <AppShell
        view="incheon"
        screen={screen}
        setScreen={setScreen}
        routePage={true}
        routeBright={true}
        showStationMarkers={true}
      >
        <RouteSelectionScreen
          selectedRoute={selectedRoute}
          selectedRouteId={selectedRouteId}
          setSelectedRouteId={setSelectedRouteId}
          onContinue={() => setScreen("pass")}
        />
      </AppShell>
    );
  }

  if (screen === "pass") {
    return (
      <AppShell
        view="asia"
        screen={screen}
        setScreen={setScreen}
        blurred={true}
      >
        <BoardingPass
          selectedRoute={selectedRoute}
          minutes={minutes}
          focusLabel={settings.focusLabel}
          onStart={startRide}
        />
      </AppShell>
    );
  }

  if (screen === "history") {
    return (
      <AppShell view="incheon" screen={screen} setScreen={setScreen}>
        <div className="flex min-h-screen max-w-5xl flex-col justify-start px-8 py-32">
          <h1 className="text-5xl font-black tracking-tight">
            Your study rides.
          </h1>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/70 p-6 backdrop-blur-2xl">
            {logs.length === 0 ? (
              <p className="text-slate-300">No study rides yet.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{log.task}</p>
                        <p className="text-sm text-slate-300">
                          {log.route} · {log.minutes} min
                        </p>
                      </div>

                      <p className="text-sm text-slate-400">
                        {log.completedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (screen === "settings") {
    return (
      <AppShell view="incheon" screen={screen} setScreen={setScreen}>
        <SettingsScreen
          settings={settings}
          updateSettings={updateSettings}
          onPreviewAlarm={previewAlarm}
          onClearHistory={clearHistory}
          logsCount={logs.length}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      view="incheon"
      screen={screen}
      setScreen={setScreen}
      blurred={true}
    >
      <LiveRideContent
        selectedRoute={selectedRoute}
        secondsLeft={secondsLeft}
        progress={progress}
        running={running}
        focusLabel={settings.focusLabel}
        onPause={pauseRide}
        onResume={resumeRide}
        onReset={resetRide}
        onHistory={() => setScreen("history")}
        onSettings={() => setScreen("settings")}
        onOpenMusic={openYouTubeMusic}
      />

      {alarmActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-red-400/30 bg-red-950/80 p-8 text-center shadow-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-red-200">
              Arrived
            </p>

            <h2 className="mt-3 text-4xl font-black text-white">
              Study ride complete.
            </h2>

            <p className="mt-3 text-red-100/75">
              Timer finished. Stop your YouTube music manually if it is playing
              in another tab.
            </p>

            <button
              onClick={stopCurrentAlarm}
              className="mt-8 w-full rounded-2xl bg-white px-6 py-5 text-lg font-black text-black"
            >
              Stop Alarm
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}