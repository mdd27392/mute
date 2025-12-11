export function initMuteUI() {
  const meterFill = document.getElementById("meter-fill");
  const meterIndicator = document.getElementById("meter-indicator");
  const logList = document.getElementById("log-list");
  const logEmpty = document.getElementById("log-empty");
  const logDay = document.getElementById("log-day");
  const summaryPill = document.getElementById("summary-pill");

  const btnQuiet = document.getElementById("btn-quiet");
  const btnMid = document.getElementById("btn-mid");
  const btnLoud = document.getElementById("btn-loud");

  if (!meterFill || !meterIndicator || !logList || !logDay || !summaryPill) {
    return;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const STORAGE_KEY = "mute-log:" + todayKey;

  const LEVELS = {
    quiet: { value: 0.15, position: 12 },
    mid: { value: 0.55, position: 50 },
    loud: { value: 0.9, position: 88 }
  };

  function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const h12 = ((hours + 11) % 12) + 1;
    const suffix = hours >= 12 ? "PM" : "AM";
    const pad = (n) => String(n).padStart(2, "0");
    return `${h12}:${pad(minutes)} ${suffix}`;
  }

  function loadEntries() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      console.error("Failed to load mute entries", err);
      return [];
    }
  }

  function saveEntries(entries) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.error("Failed to save mute entries", err);
    }
  }

  function renderEntries(entries) {
    logList.innerHTML = "";
    if (!entries.length) {
      if (logEmpty) {
        logEmpty.style.display = "block";
        logList.appendChild(logEmpty);
      }
    } else {
      if (logEmpty) {
        logEmpty.style.display = "none";
      }
      entries.slice(-12).forEach((entry) => {
        const li = document.createElement("li");
        li.className = "log-item";

        const badge = document.createElement("span");
        badge.className = "log-badge " + entry.level;
        badge.textContent = entry.level.toUpperCase();

        const time = document.createElement("span");
        time.className = "log-time";
        time.textContent = formatTime(entry.time);

        li.appendChild(badge);
        li.appendChild(time);
        logList.appendChild(li);
      });
    }

    const summary = entries.reduce(
      (acc, entry) => {
        acc[entry.level] = (acc[entry.level] || 0) + 1;
        return acc;
      },
      { quiet: 0, mid: 0, loud: 0 }
    );

    summaryPill.textContent =
      `${summary.quiet} quiet · ${summary.mid} medium · ${summary.loud} loud`;
  }

  function updateMeter(level) {
    const info = LEVELS[level];
    if (!info) return;
    meterFill.firstElementChild?.style.setProperty("transform", `scaleX(${info.value})`);
    meterIndicator.style.transform = `translateX(${info.position - 50}%)`;

    [btnQuiet, btnMid, btnLoud].forEach((btn) => {
      if (!btn) return;
      const lvl = btn.getAttribute("data-level");
      if (lvl === level) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function addEntry(level) {
    const entries = loadEntries();
    entries.push({ level, time: new Date().toISOString() });
    saveEntries(entries);
    renderEntries(entries);
    updateMeter(level);
  }

  const now = new Date();
  const dayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  logDay.textContent = dayFormatter.format(now);

  const existing = loadEntries();
  renderEntries(existing);
  if (existing.length) {
    updateMeter(existing[existing.length - 1].level);
  } else {
    updateMeter("quiet");
  }

  if (btnQuiet) btnQuiet.addEventListener("click", () => addEntry("quiet"));
  if (btnMid) btnMid.addEventListener("click", () => addEntry("mid"));
  if (btnLoud) btnLoud.addEventListener("click", () => addEntry("loud"));
}
