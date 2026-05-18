"use client";

import { useEffect, useState } from "react";

type Screen = "home" | "timer";

type Point = {
  x: number;
  y: number;
};

type SessionLog = {
  task: string;
  minutes: number;
  completedAt: string;
};

const STORAGE_KEYS = {
  logs: "subway-study-session-logs",
  count: "subway-study-completed-count",
  dailyGoal: "subway-study-daily-goal",
  date: "subway-study-current-date",
  sound: "subway-study-sound-enabled",
  vibration: "subway-study-vibration-enabled",
};

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

const routes = [
  {
    id: "inu-to-techno",
    label: "Incheon National University → Technopark",
    from: "Incheon Nat’l Univ.",
    to: "Technopark",
    line: "Incheon Line 1",
    minutes: 3,
    path: [
      { x: 70.3, y: 93.8 }, // 인천대입구
      { x: 80.3, y: 93.8 }, // 지식정보단지
      { x: 95.5, y: 93.8 },
      { x: 95.5, y: 84.0 },
      { x: 95.5, y: 74.0 },
      { x: 94.5, y: 68.5 },
      { x: 86.7, y: 68.5 }, // 테크노파크
    ],
  },
  {
    id: "techno-to-inu",
    label: "Technopark → Incheon National University",
    from: "Technopark",
    to: "Incheon Nat’l Univ.",
    line: "Incheon Line 1",
    minutes: 3,
    path: [
      { x: 86.7, y: 68.5 },
      { x: 94.5, y: 68.5 },
      { x: 95.5, y: 74.0 },
      { x: 95.5, y: 84.0 },
      { x: 95.5, y: 93.8 },
      { x: 80.3, y: 93.8 },
      { x: 70.3, y: 93.8 },
    ],
  },
  {
    id: "custom-5",
    label: "5-minute study session",
    from: "Gyeyang",
    to: "Incheon Nat’l Univ.",
    line: "Incheon Line 1",
    minutes: 5,
    path: [
      { x: 20.8, y: 21.9 },
      { x: 31.2, y: 21.9 },
      { x: 41.2, y: 21.9 },
      { x: 51.2, y: 21.9 },
      { x: 61.2, y: 21.9 },
      { x: 71.2, y: 21.9 },
      { x: 81.2, y: 21.9 },
      { x: 91.0, y: 21.9 },
      { x: 96.0, y: 26.0 },
      { x: 96.0, y: 36.0 },
      { x: 94.5, y: 45.0 },
      { x: 81.7, y: 45.0 },
      { x: 71.5, y: 45.0 },
      { x: 61.5, y: 45.0 },
      { x: 51.5, y: 45.0 },
      { x: 41.5, y: 45.0 },
      { x: 31.5, y: 45.0 },
      { x: 21.5, y: 45.0 },
      { x: 11.5, y: 45.0 },
      { x: 4.0, y: 49.5 },
      { x: 4.0, y: 59.5 },
      { x: 6.5, y: 68.5 },
      { x: 16.7, y: 68.5 },
      { x: 26.7, y: 68.5 },
      { x: 36.7, y: 68.5 },
      { x: 46.7, y: 68.5 },
      { x: 56.7, y: 68.5 },
      { x: 66.7, y: 68.5 },
      { x: 76.7, y: 68.5 },
      { x: 86.7, y: 68.5 },
      { x: 95.5, y: 73.5 },
      { x: 95.5, y: 83.5 },
      { x: 95.5, y: 93.8 },
      { x: 80.3, y: 93.8 },
      { x: 70.3, y: 93.8 },
    ],
  },
  {
    id: "custom-10",
    label: "10-minute study session",
    from: "Gyeyang",
    to: "Incheon Nat’l Univ.",
    line: "Incheon Line 1",
    minutes: 10,
    path: [
      { x: 20.8, y: 21.9 },
      { x: 31.2, y: 21.9 },
      { x: 41.2, y: 21.9 },
      { x: 51.2, y: 21.9 },
      { x: 61.2, y: 21.9 },
      { x: 71.2, y: 21.9 },
      { x: 81.2, y: 21.9 },
      { x: 91.0, y: 21.9 },
      { x: 96.0, y: 26.0 },
      { x: 96.0, y: 36.0 },
      { x: 94.5, y: 45.0 },
      { x: 81.7, y: 45.0 },
      { x: 71.5, y: 45.0 },
      { x: 61.5, y: 45.0 },
      { x: 51.5, y: 45.0 },
      { x: 41.5, y: 45.0 },
      { x: 31.5, y: 45.0 },
      { x: 21.5, y: 45.0 },
      { x: 11.5, y: 45.0 },
      { x: 4.0, y: 49.5 },
      { x: 4.0, y: 59.5 },
      { x: 6.5, y: 68.5 },
      { x: 16.7, y: 68.5 },
      { x: 26.7, y: 68.5 },
      { x: 36.7, y: 68.5 },
      { x: 46.7, y: 68.5 },
      { x: 56.7, y: 68.5 },
      { x: 66.7, y: 68.5 },
      { x: 76.7, y: 68.5 },
      { x: 86.7, y: 68.5 },
      { x: 95.5, y: 73.5 },
      { x: 95.5, y: 83.5 },
      { x: 95.5, y: 93.8 },
      { x: 80.3, y: 93.8 },
      { x: 70.3, y: 93.8 },
    ],
  },
];

function getDotPosition(progress: number, path: Point[]) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const target = (safeProgress / 100) * (path.length - 1);

  const index = Math.floor(target);
  const nextIndex = Math.min(index + 1, path.length - 1);
  const ratio = target - index;

  const current = path[index];
  const next = path[nextIndex];

  return {
    x: current.x + (next.x - current.x) * ratio,
    y: current.y + (next.y - current.y) * ratio,
  };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [hasLoaded, setHasLoaded] = useState(false);

  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId)!;

  const [customMinutes, setCustomMinutes] = useState(selectedRoute.minutes);
  const [secondsLeft, setSecondsLeft] = useState(selectedRoute.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [task, setTask] = useState("");
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const totalSeconds = customMinutes * 60;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const progress =
    totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const goalProgress = Math.min((completedSessions / dailyGoal) * 100, 100);
  const dotPosition = getDotPosition(progress, selectedRoute.path);

  useEffect(() => {
    const today = getTodayKey();

    const savedDate = localStorage.getItem(STORAGE_KEYS.date);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.logs);
    const savedCount = localStorage.getItem(STORAGE_KEYS.count);
    const savedDailyGoal = localStorage.getItem(STORAGE_KEYS.dailyGoal);
    const savedSound = localStorage.getItem(STORAGE_KEYS.sound);
    const savedVibration = localStorage.getItem(STORAGE_KEYS.vibration);

    if (savedDailyGoal) setDailyGoal(Number(savedDailyGoal));
    if (savedSound !== null) setSoundEnabled(savedSound === "true");
    if (savedVibration !== null) {
      setVibrationEnabled(savedVibration === "true");
    }

    if (savedDate === today) {
      if (savedLogs) setSessionLogs(JSON.parse(savedLogs));
      if (savedCount) setCompletedSessions(Number(savedCount));
    } else {
      setSessionLogs([]);
      setCompletedSessions(0);
      localStorage.setItem(STORAGE_KEYS.date, today);
      localStorage.removeItem(STORAGE_KEYS.logs);
      localStorage.removeItem(STORAGE_KEYS.count);
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem(STORAGE_KEYS.date, getTodayKey());
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(sessionLogs));
    localStorage.setItem(STORAGE_KEYS.count, String(completedSessions));
    localStorage.setItem(STORAGE_KEYS.dailyGoal, String(dailyGoal));
    localStorage.setItem(STORAGE_KEYS.sound, String(soundEnabled));
    localStorage.setItem(STORAGE_KEYS.vibration, String(vibrationEnabled));
  }, [
    hasLoaded,
    sessionLogs,
    completedSessions,
    dailyGoal,
    soundEnabled,
    vibrationEnabled,
  ]);

  useEffect(() => {
    setIsRunning(false);
    setShowCompleteModal(false);
    setCustomMinutes(selectedRoute.minutes);
    setSecondsLeft(selectedRoute.minutes * 60);
  }, [selectedRouteId, selectedRoute.minutes]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  function playAlertSound() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.6
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
  }

  function completeSession() {
    setIsRunning(false);
    setCompletedSessions((count) => count + 1);

    const newLog: SessionLog = {
      task: task.trim() || "Untitled study session",
      minutes: customMinutes,
      completedAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setSessionLogs((logs) => [newLog, ...logs].slice(0, 10));
    setShowCompleteModal(true);

    if (soundEnabled) {
      playAlertSound();
    }

    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function applyCustomMinutes(value: number) {
    const safeValue = Math.max(1, Math.min(120, value || 1));
    setCustomMinutes(safeValue);
    setIsRunning(false);
    setShowCompleteModal(false);
    setSecondsLeft(safeValue * 60);
  }

  function startTimer() {
    if (secondsLeft > 0) {
      setShowCompleteModal(false);
      setIsRunning(true);
    }
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setShowCompleteModal(false);
    setSecondsLeft(totalSeconds);
  }

  function startAnotherRide() {
    setShowCompleteModal(false);
    setSecondsLeft(totalSeconds);
    setIsRunning(true);
  }

  function clearLogs() {
    setSessionLogs([]);
    setCompletedSessions(0);
    localStorage.setItem(STORAGE_KEYS.date, getTodayKey());
    localStorage.removeItem(STORAGE_KEYS.logs);
    localStorage.removeItem(STORAGE_KEYS.count);
  }

  if (screen === "home") {
    return (
      <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm text-slate-500">Subway Study</p>
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-6xl">
                Study between stations.
              </h1>
              <p className="mt-4 max-w-xl text-slate-600">
                A small study timer built around short subway rides, quick focus
                sessions, and steady daily progress.
              </p>
            </div>

            <button
              onClick={() => setScreen("timer")}
              className="rounded-full bg-slate-900 px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start a study ride
            </button>
          </header>

          <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Default route
                  </p>
                  <p className="mt-1 font-medium">Incheon Line 1</p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                  3 min
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-slate-100 bg-[#f8f6f1] p-3">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="/incheon-line1.png"
                    alt="Incheon Line 1 subway map"
                    className="block w-full"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-5">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Today’s progress</p>
                <p className="mt-2 text-5xl font-semibold">
                  {completedSessions}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  completed study rides
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Daily goal: {dailyGoal} rides
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Quick idea
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Use this for vocabulary, coding drills, reading, math review,
                  or any task that fits into a short ride.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-5 py-6 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Subway Study</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight">
              Study ride
            </h1>
          </div>

          <button
            onClick={() => setScreen("home")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Home
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {isRunning ? "On the way" : "Ready to begin"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedRoute.line}
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                {customMinutes} min
              </span>
            </div>

            <div className="mb-6 text-6xl font-semibold tracking-tight text-slate-900 md:text-7xl">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>

            {task && (
              <div className="mb-6 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                Studying: {task}
              </div>
            )}

            <div className="mb-7">
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f6f1] p-3">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="/incheon-line1.png"
                    alt="Incheon Line 1 subway map"
                    className="block w-full"
                  />

                  <div
                    className="absolute z-20 transition-all duration-700 ease-linear"
                    style={{
                      left: `${dotPosition.x}%`,
                      top: `${dotPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <div className="absolute h-4 w-4 rounded-full bg-red-500/20" />
                      <div className="h-3 w-3 rounded-full border border-white bg-red-500 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>{selectedRoute.from}</span>
                <span>{selectedRoute.to}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="flex-1 rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-slate-800"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 rounded-2xl bg-amber-300 px-6 py-4 font-semibold text-slate-900 hover:bg-amber-200"
                >
                  Pause
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex-1 rounded-2xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Reset
              </button>
            </div>

            {secondsLeft === 0 && (
              <p className="mt-5 font-medium text-emerald-700">
                Arrived. One focused session completed.
              </p>
            )}
          </section>

          <aside className="grid gap-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Current route
                  </p>
                  <p className="mt-1 font-medium">{selectedRoute.line}</p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                  {customMinutes} min
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="mb-1 text-xs text-slate-400">From</p>
                  <p className="font-semibold leading-snug">
                    {selectedRoute.from}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  →
                </div>

                <div className="flex-1 text-right">
                  <p className="mb-1 text-xs text-slate-400">To</p>
                  <p className="font-semibold leading-snug">
                    {selectedRoute.to}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Study focus
              </label>

              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Vocabulary, coding, AP review..."
                className="mb-3 w-full rounded-2xl border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400"
              />

              <div className="mb-4 flex flex-wrap gap-2">
                {["Vocabulary", "Coding", "AP Review", "Reading", "Math"].map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => setTask(preset)}
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        task === preset
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Route or session
              </label>

              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="mb-4 w-full rounded-2xl border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-slate-900 outline-none focus:border-emerald-400"
              >
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Minutes
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customMinutes}
                    onChange={(e) => applyCustomMinutes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-slate-900 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Daily goal
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={dailyGoal}
                    onChange={(e) =>
                      setDailyGoal(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1))
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-slate-900 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  End-of-ride alerts
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSoundEnabled((value) => !value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      soundEnabled
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-[#f8f6f1] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold">Sound</p>
                    <p
                      className={`mt-1 text-xs ${
                        soundEnabled ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {soundEnabled ? "On" : "Off"}
                    </p>
                  </button>

                  <button
                    onClick={() => setVibrationEnabled((value) => !value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      vibrationEnabled
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-[#f8f6f1] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold">Vibration</p>
                    <p
                      className={`mt-1 text-xs ${
                        vibrationEnabled ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {vibrationEnabled ? "On" : "Off"}
                    </p>
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Today’s goal</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {completedSessions}/{dailyGoal}
                  </p>
                  <p className="text-sm text-slate-500">
                    study rides completed
                  </p>
                </div>

                {sessionLogs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>

              {completedSessions >= dailyGoal ? (
                <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Daily goal reached. Nice work today.
                </p>
              ) : (
                <p className="mb-4 text-sm text-slate-500">
                  {dailyGoal - completedSessions} more study ride
                  {dailyGoal - completedSessions === 1 ? "" : "s"} to reach
                  today’s goal.
                </p>
              )}

              {sessionLogs.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Finish a ride to see your study history here.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessionLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-t border-slate-100 pt-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{log.task}</p>
                        <p className="text-xs text-slate-400">
                          {log.minutes} min study ride
                        </p>
                      </div>

                      <p className="text-xs text-slate-400">
                        {log.completedAt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-900 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-700">Arrived</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                  Session complete.
                </h2>
              </div>

              <button
                onClick={() => setShowCompleteModal(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-[#f8f6f1] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Study focus
              </p>
              <p className="mt-1 text-lg font-semibold">
                {task.trim() || "Untitled study session"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Duration</p>
                  <p className="font-medium">{customMinutes} min</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Today</p>
                  <p className="font-medium">
                    {completedSessions}/{dailyGoal} rides
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            <p className="mb-6 text-sm text-slate-500">
              Nice work. You completed one focused study ride.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startAnotherRide}
                className="rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white hover:bg-slate-800"
              >
                Start another
              </button>

              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setScreen("home");
                }}
                className="rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Back home
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}