"use client";

import { useEffect, useState } from "react";

const routes = [
  {
    id: "inu-to-techno",
    label: "Incheon National University → Technopark",
    from: "Incheon Nat’l Univ.",
    to: "Technopark",
    line: "Incheon Line 1",
    minutes: 3,
  },
  {
    id: "techno-to-inu",
    label: "Technopark → Incheon National University",
    from: "Technopark",
    to: "Incheon Nat’l Univ.",
    line: "Incheon Line 1",
    minutes: 3,
  },
  {
    id: "custom-5",
    label: "5-minute study session",
    from: "Focus",
    to: "Complete",
    line: "Custom Session",
    minutes: 5,
  },
  {
    id: "custom-10",
    label: "10-minute study session",
    from: "Focus",
    to: "Complete",
    line: "Custom Session",
    minutes: 10,
  },
];

type SessionLog = {
  task: string;
  minutes: number;
  completedAt: string;
};

export default function Home() {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId)!;

  const [customMinutes, setCustomMinutes] = useState(selectedRoute.minutes);
  const [secondsLeft, setSecondsLeft] = useState(selectedRoute.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [task, setTask] = useState("");
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  useEffect(() => {
    const savedLogs = localStorage.getItem("subway-study-session-logs");
    const savedCount = localStorage.getItem("subway-study-completed-count");

    if (savedLogs) setSessionLogs(JSON.parse(savedLogs));
    if (savedCount) setCompletedSessions(Number(savedCount));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "subway-study-session-logs",
      JSON.stringify(sessionLogs)
    );
    localStorage.setItem(
      "subway-study-completed-count",
      String(completedSessions)
    );
  }, [sessionLogs, completedSessions]);

  useEffect(() => {
    setIsRunning(false);
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

  const totalSeconds = customMinutes * 60;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress =
    totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  function playAlertSound() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
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

    playAlertSound();

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function applyCustomMinutes(value: number) {
    const safeValue = Math.max(1, Math.min(120, value));
    setCustomMinutes(safeValue);
    setIsRunning(false);
    setSecondsLeft(safeValue * 60);
  }

  function startTimer() {
    if (secondsLeft > 0) setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }

  function clearLogs() {
    setSessionLogs([]);
    setCompletedSessions(0);
    localStorage.removeItem("subway-study-session-logs");
    localStorage.removeItem("subway-study-completed-count");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 flex justify-center">
      <div className="w-full max-w-md">
        <header className="mb-5 pt-4">
          <p className="text-sm text-slate-400">Subway-based focus tool</p>
          <h1 className="text-4xl font-bold tracking-tight mt-1">
            Study Timer
          </h1>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs bg-emerald-400 text-slate-950 px-3 py-1 rounded-full font-bold">
              {selectedRoute.line}
            </span>
            <span className="text-xs text-slate-400">
              {customMinutes} min
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">From</p>
              <p className="font-semibold">{selectedRoute.from}</p>
            </div>

            <div className="text-2xl text-slate-500">→</div>

            <div className="flex-1 text-right">
              <p className="text-xs text-slate-500 mb-1">To</p>
              <p className="font-semibold">{selectedRoute.to}</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
          <label className="block text-sm text-slate-300 mb-2">
            What will you study?
          </label>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Example: coding, vocabulary, AP review..."
            className="w-full mb-4 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500"
          />

          <label className="block text-sm text-slate-300 mb-2">
            Select route or session
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full mb-4 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white"
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.label}
              </option>
            ))}
          </select>

          <label className="block text-sm text-slate-300 mb-2">
            Study length in minutes
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={customMinutes}
            onChange={(e) => applyCustomMinutes(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white"
          />
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-5 text-center shadow-xl">
          <p className="text-slate-400 text-sm mb-2">
            {isRunning ? "Studying now" : "Ready to start"}
          </p>

          <div className="text-7xl font-bold tracking-tight mb-4">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>

          {task && (
            <div className="bg-slate-800 rounded-2xl px-4 py-3 mb-5">
              <p className="text-xs text-slate-400 mb-1">Now studying</p>
              <p className="font-semibold">{task}</p>
            </div>
          )}

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-3 justify-center">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="flex-1 px-6 py-3 bg-white text-slate-950 rounded-2xl font-semibold hover:bg-slate-200"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex-1 px-6 py-3 bg-yellow-400 text-slate-950 rounded-2xl font-semibold hover:bg-yellow-300"
              >
                Pause
              </button>
            )}

            <button
              onClick={resetTimer}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-2xl font-semibold hover:bg-slate-700"
            >
              Reset
            </button>
          </div>

          {secondsLeft === 0 && (
            <p className="mt-5 text-emerald-400 font-semibold">
              Time&apos;s up! You completed one focused session.
            </p>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Total completed</p>
              <p className="text-2xl font-bold">{completedSessions}</p>
            </div>

            {sessionLogs.length > 0 && (
              <button
                onClick={clearLogs}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear history
              </button>
            )}
          </div>

          {sessionLogs.length === 0 ? (
            <p className="text-sm text-slate-500">
              No completed sessions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{log.task}</p>
                    <p className="text-xs text-slate-400">
                      {log.minutes} min session
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{log.completedAt}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}