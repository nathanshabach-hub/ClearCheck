import React, { useState, useMemo } from "react";
import { Droplet, Waves, AlertTriangle, CheckCircle2, Beaker, Moon, Sun, X } from "lucide-react";

/* ---------------------------------------------------------
   Design tokens
--------------------------------------------------------- */
const COLORS = {
  tealDeep: "#0B4F4A",
  tealMid: "#146B63",
  aqua: "#2FB6A8",
  aquaSoft: "#CFEAE6",
  sand: "#F5F1E8",
  sand2: "#EBE4D2",
  navy: "#16302E",
  navySoft: "#4C6360",
  amber: "#C9861F",
  amberBg: "#F6E4C1",
  coral: "#C24A34",
  coralBg: "#F3D9D1",
  white: "#FFFFFF",
};

/* ---------------------------------------------------------
   Strip parameter definitions
--------------------------------------------------------- */
const PARAMS = [
  {
    key: "fc",
    label: "Free Chlorine",
    unit: "ppm",
    values: [0, 1, 3, 5, 10, 20],
    colors: ["#FAF7F2", "#F7D6DE", "#F2AEC0", "#E8829F", "#D65578", "#B92F58"],
  },
  {
    key: "tc",
    label: "Total Chlorine",
    unit: "ppm",
    values: [0, 1, 3, 5, 10, 20],
    colors: ["#FAF7F2", "#E9D6F2", "#D3AEE8", "#B77FDB", "#9750CB", "#7A2FB0"],
  },
  {
    key: "ph",
    label: "pH",
    unit: "",
    values: [6.8, 7.2, 7.5, 7.8, 8.2, 8.4],
    colors: ["#F2E14E", "#F2C24E", "#EF9A4E", "#E8734A", "#D6494A", "#B23A6B"],
  },
  {
    key: "ta",
    label: "Total Alkalinity",
    unit: "ppm",
    values: [0, 40, 80, 120, 180, 240],
    colors: ["#F2E8A0", "#D8E89A", "#A9D98C", "#6FC48C", "#3FA98F", "#1F7A7A"],
  },
  {
    key: "cya",
    label: "Cyanuric Acid",
    unit: "ppm",
    values: [0, 30, 50, 100, 150, 300],
    colors: ["#FAF7F2", "#F5EBC9", "#EDD89A", "#E0BE66", "#CC9F3F", "#A97A2A"],
  },
  {
    key: "ch",
    label: "Total Hardness",
    unit: "ppm",
    values: [0, 25, 50, 120, 250, 425],
    colors: ["#EAF3F5", "#C7E3E8", "#9ED0DA", "#66AEC0", "#357F99", "#1B4F66"],
  },
];

const IDEAL = {
  pool: { fc: [1, 3], tc: [1, 3], ph: [7.2, 7.8], ta: [80, 120], cya: [30, 50], ch: [200, 400] },
  spa: { fc: [3, 5], tc: [3, 5], ph: [7.2, 7.8], ta: [80, 100], cya: [0, 50], ch: [150, 250] },
};

const GAL_TO_L = 3.78541;
const UNIT_TO_L = { L: 1, gal: GAL_TO_L, mL: 0.001 };

function litersToUnit(liters, unit) {
  return unit === "L" ? liters : Math.round(liters / UNIT_TO_L[unit]);
}

/* ---------------------------------------------------------
   Chemistry — approximate, widely-cited rules of thumb,
   cross-checked against commercial dosing calculators and
   product-label guidance (ClearWater, HotTubCalc, DoseMyPool).
   Rates are grams (or ml) per 1000 L per unit of change.
--------------------------------------------------------- */
const RATE = {
  phUpPer0_1: 10,     // g soda ash per 0.1 pH per 1000L
  phDownPer0_1: 7,    // g sodium bisulfate (dry acid) per 0.1 pH per 1000L
  taUpPer10: 17,      // g sodium bicarbonate per 10ppm per 1000L
  taDownPer10: 25,    // ml muriatic acid per 10ppm per 1000L
  cyaUpPer10: 10,     // g cyanuric acid per 10ppm per 1000L
  chUpPer10: 15,      // g calcium chloride per 10ppm per 1000L
  fcUpPer1: 2.2,      // g granular chlorine per 1ppm per 1000L
};

function mid(range) {
  return (range[0] + range[1]) / 2;
}

function statusOf(key, value, mode) {
  const [lo, hi] = IDEAL[mode][key];
  if (value < lo) return "low";
  if (value > hi) return "high";
  return "ideal";
}

function fmt(n) {
  if (n >= 100) return Math.round(n / 5) * 5;
  if (n >= 20) return Math.round(n);
  return Math.round(n * 2) / 2;
}

function recommendationFor(key, value, mode, volumeL, allValues) {
  const status = statusOf(key, value, mode);
  const range = IDEAL[mode][key];
  const target = mid(range);
  const factor = volumeL / 1000;

  if (status === "ideal") {
    return { status, headline: "Balanced — no action needed." };
  }

  switch (key) {
    case "fc": {
      if (status === "low") {
        const amount = fmt(RATE.fcUpPer1 * (target - value) * factor);
        const product = mode === "spa" ? "Sodium dichlor (spa chlorinating granules)" : "Calcium hypochlorite (granular chlorine)";
        const brand = mode === "spa" ? "e.g. Poolwerx Spa Chlorine Granules" : "e.g. Clearwater Granular Chlorine";
        return {
          status,
          product,
          brand,
          headline: `Add ${amount} g of ${product.toLowerCase()}`,
          detail: `Dissolve in a bucket of water first, then pour evenly around the water with the pump running. Wait 20–30 minutes and retest.`,
        };
      }
      return {
        status,
        headline: "Free chlorine is high — stop dosing and wait it out.",
        detail: "Keep the pump running and avoid swimming until the level drops back into range, usually within a day in sunlight (pools) or a few hours (spas).",
      };
    }
    case "tc": {
      const fcVal = allValues.fc ?? value;
      const combined = value - fcVal;
      if (combined > 0.5) {
        const shockAmount = fmt(RATE.fcUpPer1 * combined * 10 * factor);
        const product = mode === "spa" ? "sodium dichlor" : "calcium hypochlorite";
        return {
          status: "high",
          headline: `Combined chlorine is ${combined.toFixed(1)} ppm — shock the water.`,
          product: "Shock treatment",
          brand: mode === "spa" ? "e.g. Poolwerx Spa Shock" : "e.g. Clearwater Superstore Shock",
          detail: `Add roughly ${shockAmount} g of ${product} (about 10× the combined chlorine reading — standard breakpoint dose). Add at dusk, run the pump overnight, and stay out of the water until free chlorine drops back near normal and the chlorine smell fades.`,
        };
      }
      return { status: "ideal", headline: "Combined chlorine is low — free and total chlorine are close, which is what you want." };
    }
    case "ph": {
      const diff = Math.round(Math.abs(target - value) * 10) / 10;
      if (status === "low") {
        const amount = fmt(RATE.phUpPer0_1 * (diff / 0.1) * factor);
        return {
          status,
          product: "Sodium carbonate (soda ash / pH increaser)",
          brand: "e.g. Poolwerx pH Up",
          headline: `Add ${amount} g of pH increaser`,
          detail: "Pre-dissolve in water and pour around the edges with the pump running. Recheck pH after a few hours before adding more.",
        };
      }
      const amount = fmt(RATE.phDownPer0_1 * (diff / 0.1) * factor);
      return {
        status,
        product: "Sodium bisulfate (dry acid / pH decreaser)",
        brand: "e.g. Poolwerx pH Down",
        headline: `Add ${amount} g of pH decreaser`,
        detail: "Pour slowly into the deepest, most turbulent part of the water with the pump running. Recheck pH after a few hours.",
      };
    }
    case "ta": {
      const diff = Math.abs(target - value);
      if (status === "low") {
        const amount = fmt(RATE.taUpPer10 * (diff / 10) * factor);
        return {
          status,
          product: "Sodium bicarbonate (alkalinity increaser)",
          brand: "e.g. Poolwerx Alkalinity Increaser (plain baking soda also works)",
          headline: `Add ${amount} g of alkalinity increaser`,
          detail: "Broadcast evenly across the surface with the pump running. Wait 6 hours and retest before adjusting pH.",
        };
      }
      const amountMl = fmt(RATE.taDownPer10 * (diff / 10) * factor);
      return {
        status,
        product: "Muriatic acid (diluted)",
        brand: "e.g. Clearwater Muriatic / Hydrochloric Acid",
        headline: `Add ${amountMl} ml of muriatic acid`,
        detail: "Dilute in water first — always add acid to water, never the reverse. Pour into one spot with the pump off, wait 30 minutes, then circulate. Wear gloves and eye protection.",
      };
    }
    case "cya": {
      if (status === "low") {
        if (mode === "spa") {
          return {
            status,
            headline: "Cyanuric acid is low — usually fine for an indoor or frequently-drained spa.",
            detail: "Only add stabiliser if your spa sits outdoors in direct sun for long periods.",
          };
        }
        const amount = fmt(RATE.cyaUpPer10 * ((target - value) / 10) * factor);
        return {
          status,
          product: "Cyanuric acid (stabiliser / conditioner)",
          brand: "e.g. Poolwerx Stabiliser & Conditioner",
          headline: `Add ${amount} g of stabiliser`,
          detail: "Add to the skimmer basket with the pump running, or pre-dissolve. It can take several days to fully register on a retest.",
        };
      }
      return {
        status,
        headline: "Cyanuric acid is high — this can only be lowered by dilution.",
        detail: "Partially drain and refill with fresh water to bring the level back down. There's no chemical that removes stabiliser.",
      };
    }
    case "ch": {
      if (status === "low") {
        const amount = fmt(RATE.chUpPer10 * ((target - value) / 10) * factor);
        return {
          status,
          product: "Calcium chloride (hardness increaser)",
          brand: "e.g. Poolwerx Calcium Hardness Increaser",
          headline: `Add ${amount} g of hardness increaser`,
          detail: "Pre-dissolve in a bucket — it heats up as it dissolves. Add slowly with the pump running.",
        };
      }
      return {
        status,
        headline: "Hardness is high — this can only be lowered by dilution.",
        detail: "Partially drain and refill with fresh water. High hardness mainly risks scaling on tiles and equipment.",
      };
    }
    default:
      return { status: "ideal", headline: "" };
  }
}

/* ---------------------------------------------------------
   UI bits
--------------------------------------------------------- */
function StatusPill({ status }) {
  const map = {
    ideal: { bg: COLORS.aquaSoft, fg: COLORS.tealDeep, text: "Ideal" },
    low: { bg: COLORS.amberBg, fg: COLORS.amber, text: "Low" },
    high: { bg: COLORS.coralBg, fg: COLORS.coral, text: "High" },
  };
  const s = map[status] || map.ideal;
  return (
    <span
      className="status-pill"
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: 0.2,
      }}
    >
      {s.text}
    </span>
  );
}

function ParamRow({ param, selected, onSelect }) {
  const idx = param.values.indexOf(selected);
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: COLORS.navy }}>
          {param.label}
        </span>
        <span style={{ fontSize: 13, color: COLORS.navySoft }}>
          {selected !== null ? `${selected}${param.unit ? " " + param.unit : ""}` : "tap a shade"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {param.values.map((v, i) => (
          <button
            key={v}
            className="swatch-button"
            onClick={() => onSelect(param.key, v)}
            aria-label={`${param.label} ${v}`}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              background: param.colors[i],
              border: idx === i ? `3px solid ${COLORS.tealDeep}` : "1px solid rgba(22,48,46,0.22)",
              cursor: "pointer",
              transition: "transform 0.12s ease",
              transform: idx === i ? "translateY(-2px)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main app
--------------------------------------------------------- */
export default function DipAndDose() {
  const [mode, setMode] = useState("pool");
  const [unit, setUnit] = useState("L");
  const [volume, setVolume] = useState(40000);
  const [readings, setReadings] = useState({ fc: null, tc: null, ph: null, ta: null, cya: null, ch: null });
  const [showResults, setShowResults] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [readingsOpen, setReadingsOpen] = useState(true);

  const allSelected = PARAMS.every((p) => readings[p.key] !== null);
  const volumeL = volume * UNIT_TO_L[unit];

  const results = useMemo(() => {
    if (!allSelected) return [];
    return PARAMS.map((p) => ({
      ...p,
      rec: recommendationFor(p.key, readings[p.key], mode, volumeL, readings),
    }));
  }, [readings, mode, volumeL, allSelected]);

  const actionable = results.filter((r) => r.rec.status !== "ideal");

  function handleSelect(key, value) {
    setReadings((r) => ({ ...r, [key]: value }));
    setShowResults(false);
  }

  function handleModeChange(next) {
    setMode(next);
    const liters = next === "spa" ? 1500 : 40000;
    setVolume(litersToUnit(liters, unit));
    setShowResults(false);
  }

  function handleUnitChange(next) {
    if (next === unit) return;
    setVolume((v) => litersToUnit(v * UNIT_TO_L[unit], next));
    setUnit(next);
  }

  const presetLiters = mode === "pool" ? [20000, 40000, 60000] : [1000, 1500, 2000];
  const presets = presetLiters.map((liters) => litersToUnit(liters, unit));

  return (
    <div
      className={`app-root${darkMode ? " dark-mode" : ""}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        background: COLORS.sand,
        minHeight: "100vh",
        color: COLORS.navy,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #dcefed; }
        button { font-family: inherit; }
        input[type="number"]::-webkit-inner-spin-button { opacity: 1; }
        .app-root {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #eaf5f3 0%, #f5f1e8 48%, #d8eeed 100%) !important;
        }
        .app-root::before,
        .app-root::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          border: 1px solid rgba(47, 182, 168, 0.16);
        }
        .app-root::before { width: 520px; height: 520px; top: -260px; right: -170px; }
        .app-root::after { width: 390px; height: 390px; bottom: -220px; left: -210px; }
        .app-shell {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(280px, 0.82fr) minmax(440px, 1.18fr);
          gap: 24px;
          align-items: start;
          max-width: 1080px !important;
          padding: 73px 28px 72px !important;
        }
        .hero { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 0.72fr; gap: 48px; align-items: end; margin-bottom: 8px !important; }
        .hero h1 { font-size: clamp(32px, 4vw, 50px) !important; letter-spacing: -0.6px; }
        .hero p { max-width: 560px; font-size: 16px !important; }
        .water-strip { align-self: center; padding: 8px; border-radius: 18px; background: rgba(255,255,255,0.55); box-shadow: 0 18px 40px rgba(11,79,74,0.12); }
        .water-strip { height: 70px !important; }
        .water-strip > div { height: 54px !important; }
        .panel { box-shadow: 0 14px 34px rgba(22,48,46,0.07); transition: transform 180ms ease, box-shadow 180ms ease; }
        .panel:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(22,48,46,0.11); }
        .setup-panel { grid-column: 1; margin-bottom: 0 !important; }
        .readings-panel { grid-column: 2; grid-row: 2 / span 2; margin-bottom: 0 !important; }
        .primary-cta { grid-column: 1; margin-bottom: 0 !important; }
        .results-panel { grid-column: 1 / -1; }
        .results-overlay { position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(7, 31, 44, 0.56); backdrop-filter: blur(6px); animation: overlay-in 220ms ease-out both; }
        .results-dialog { position: relative; width: min(720px, 100%); max-height: min(780px, calc(100vh - 48px)); overflow-y: auto; padding: 28px; border-radius: 18px; background: #f5f1e8; box-shadow: 0 24px 70px rgba(0,0,0,0.28); animation: dialog-in 320ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both; }
        @keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dialog-in { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .results-close { position: absolute; top: 18px; right: 18px; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid rgba(11,79,74,0.18); border-radius: 50%; background: rgba(255,255,255,0.72); color: #0B4F4A; cursor: pointer; }
        .results-close:hover { background: #ffffff; transform: scale(1.05); }
        .results-dialog > div:first-child { padding-right: 44px; }
        .dark-mode .results-dialog { background: #0b2730; }
        .dark-mode .results-close { background: #173d46; color: #b9eee8; border-color: rgba(148,221,214,0.3); }
        .dark-mode .param-accordion { border-color: rgba(148,221,214,0.16); }
        .dark-mode .accordion-chevron { border-color: rgba(148,221,214,0.3); }
        @media (prefers-reduced-motion: reduce) {
          .results-overlay, .results-dialog { animation: none; }
        }
        .mode-button:hover, .preset-button:hover { filter: brightness(0.98); transform: translateY(-1px); }
        .swatch-button:hover { transform: translateY(-3px) !important; box-shadow: 0 4px 10px rgba(22,48,46,0.14); }
        .param-accordion { border-bottom: 1px solid rgba(22,48,46,0.12); }
        .param-accordion:last-child { border-bottom: none; }
        .param-accordion-trigger:hover { color: #0B4F4A; }
        .param-accordion-content { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 220ms ease, opacity 180ms ease; }
        .param-accordion-content > div { overflow: hidden; }
        .param-accordion-content.is-open { grid-template-rows: 1fr; opacity: 1; }
        .accordion-chevron { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 1px solid rgba(22,48,46,0.18); border-radius: 50%; font-family: "Space Grotesk", sans-serif; font-size: 16px; line-height: 1; }
        .section-accordion-trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 0 12px; border: none; background: none; color: #0B4F4A; cursor: pointer; text-align: left; }
        .section-accordion-trigger:hover { color: #146B63; }
        .section-accordion-content { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 240ms ease, opacity 180ms ease; }
        .section-accordion-content > div { overflow: hidden; }
        .section-accordion-content.is-open { grid-template-rows: 1fr; opacity: 1; }
        .primary-cta:not(:disabled):hover { background: #146b63 !important; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(11,79,74,0.2); }
        .brand-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .theme-toggle { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 1px solid rgba(11,79,74,0.18); border-radius: 50%; background: rgba(255,255,255,0.62); color: #0B4F4A; cursor: pointer; transition: transform 180ms ease, background 180ms ease, color 180ms ease; }
        .theme-toggle:hover { transform: rotate(-10deg) scale(1.05); background: #ffffff; }
        .dark-mode { color: #e6f4f2 !important; background: linear-gradient(145deg, #071f2c 0%, #0b3038 48%, #123e4a 100%) !important; }
        .dark-mode .panel { background: #102d36 !important; border-color: rgba(148, 221, 214, 0.16) !important; box-shadow: 0 14px 34px rgba(0,0,0,0.24); }
        .dark-mode .panel:hover { box-shadow: 0 18px 40px rgba(0,0,0,0.32); }
        .dark-mode h1, .dark-mode .section-kicker { color: #b9eee8 !important; }
        .dark-mode p, .dark-mode .panel div { color: #b5cfcc !important; }
        .dark-mode .panel span:not(.status-pill) { color: #d9eeeb !important; }
        .dark-mode .mode-button { color: #d9eeeb !important; background: #173d46 !important; border-color: rgba(148, 221, 214, 0.2) !important; }
        .dark-mode .mode-button[style*="2px solid"] { background: #1c5e62 !important; border-color: #8ddbd1 !important; }
        .dark-mode input { color: #e6f4f2 !important; background: #0a232c !important; border-color: rgba(148, 221, 214, 0.22) !important; }
        .dark-mode .preset-button { color: #9de1d8 !important; border-color: rgba(148, 221, 214, 0.3) !important; }
        .dark-mode .theme-toggle { background: #173d46; color: #f7d879; border-color: rgba(148, 221, 214, 0.3); }
        .dark-mode .primary-cta:disabled { color: #8aa5a2 !important; background: #29454b !important; }
        .dark-mode .results-panel > div { background: #102d36 !important; border-color: rgba(148, 221, 214, 0.16) !important; }
        @media (max-width: 760px) {
          .app-shell { display: block; padding: 51px 16px 52px !important; }
          .hero { display: block; margin-bottom: 26px !important; }
          .hero h1 { font-size: 34px !important; }
          .water-strip { margin-top: 22px; }
          .setup-panel, .readings-panel { margin-bottom: 18px !important; }
          .primary-cta { margin-bottom: 20px !important; }
          .results-overlay { align-items: flex-end; padding: 10px; }
          .results-dialog { max-height: calc(100vh - 20px); padding: 22px 16px; border-radius: 18px 18px 12px 12px; }
        }
      `}</style>

      <div className="app-shell" style={{ width: "100%", maxWidth: 460, padding: "28px 20px 60px" }}>
        {/* Hero */}
        <div className="hero" style={{ marginBottom: 28 }}>
          <div className="brand-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Beaker size={20} color={darkMode ? "#9DE1D8" : COLORS.tealDeep} />
              <span style={{ fontSize: 13, color: COLORS.tealMid, fontWeight: 600, letterSpacing: 0.3 }}>ClearCheck</span>
            </div>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setDarkMode((enabled) => !enabled)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              lineHeight: 1.15,
              fontWeight: 700,
              margin: "0 0 10px",
              color: COLORS.tealDeep,
            }}
          >
            Match your test strip, get the exact fix.
          </h1>
          <p style={{ fontSize: 15, color: COLORS.navySoft, margin: 0, lineHeight: 1.5 }}>
            Dip your strip, tap the shade closest to each pad, and we'll work out the product and measurement for your water.
          </p>

          {/* decorative strip */}
          <div className="water-strip" style={{ display: "flex", gap: 6, marginTop: 20, height: 54 }}>
            {["#F2AEC0", "#B77FDB", "#EF9A4E", "#A9D98C", "#EDD89A", "#9ED0DA"].map((c, i) => (
              <div key={i} style={{ flex: 1, background: c, borderRadius: i === 0 ? "10px 4px 4px 10px" : i === 5 ? "4px 10px 10px 4px" : 4 }} />
            ))}
          </div>
        </div>

        {/* Step 1 — pool or spa + volume */}
        <div className="panel setup-panel" style={{ background: COLORS.white, borderRadius: 14, padding: 20, marginBottom: 20, border: `1px solid ${COLORS.sand2}` }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 12, color: COLORS.tealDeep }}>
            1. What are you testing?
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { id: "pool", label: "Pool", Icon: Waves },
              { id: "spa", label: "Spa / hot tub", Icon: Droplet },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                className="mode-button"
                onClick={() => handleModeChange(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: mode === id ? `2px solid ${COLORS.tealDeep}` : `1px solid ${COLORS.sand2}`,
                  background: mode === id ? COLORS.aquaSoft : COLORS.sand,
                  color: COLORS.navy,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: COLORS.navySoft, marginBottom: 8 }}>Water volume</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${COLORS.sand2}`,
                fontSize: 15,
                fontFamily: "'Space Grotesk', sans-serif",
                color: COLORS.navy,
              }}
            />
            <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${COLORS.sand2}` }}>
              {["L", "gal", "mL"].map((u) => (
                <button
                  key={u}
                  onClick={() => handleUnitChange(u)}
                  style={{
                    padding: "0 14px",
                    background: unit === u ? COLORS.tealDeep : COLORS.white,
                    color: unit === u ? COLORS.white : COLORS.navy,
                    fontWeight: 600,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {presets.map((p) => (
              <button
                key={p}
                className="preset-button"
                onClick={() => setVolume(p)}
                style={{
                  fontSize: 12,
                  color: COLORS.tealMid,
                  background: "none",
                  border: `1px solid ${COLORS.aquaSoft}`,
                  borderRadius: 20,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                {p.toLocaleString()} {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — strip readings */}
        <div className="panel readings-panel" style={{ background: COLORS.white, borderRadius: 14, padding: 20, marginBottom: 20, border: `1px solid ${COLORS.sand2}` }}>
          <button className="section-accordion-trigger" type="button" onClick={() => setReadingsOpen((open) => !open)} aria-expanded={readingsOpen} aria-controls="readings-content">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}>2. Tap the closest shade for each pad</span>
            <span className="accordion-chevron" aria-hidden="true">{readingsOpen ? "−" : "+"}</span>
          </button>
          <div id="readings-content" className={`section-accordion-content${readingsOpen ? " is-open" : ""}`}>
            <div>
              <div style={{ fontSize: 12.5, color: COLORS.navySoft, marginBottom: 16, lineHeight: 1.5 }}>
                Tip: fix in this order for best results — alkalinity first, then pH, then sanitiser, then stabiliser/hardness.
              </div>
              {PARAMS.map((p) => (
                <ParamRow key={p.key} param={p} selected={readings[p.key]} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="primary-cta"
          onClick={() => setShowResults(true)}
          disabled={!allSelected || volumeL <= 0}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: allSelected && volumeL > 0 ? COLORS.tealDeep : COLORS.sand2,
            color: allSelected && volumeL > 0 ? COLORS.white : COLORS.navySoft,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: allSelected && volumeL > 0 ? "pointer" : "not-allowed",
            marginBottom: 20,
          }}
        >
          {allSelected ? "Get my Readings" : "Select all six shades to continue"}
        </button>

        {/* Results */}
        {showResults && allSelected && (
          <div className="results-overlay" onClick={() => setShowResults(false)}>
            <div className="results-dialog" role="dialog" aria-modal="true" aria-labelledby="dose-title" onClick={(event) => event.stopPropagation()}>
              <button className="results-close" type="button" onClick={() => setShowResults(false)} aria-label="Close dose results" title="Close dose results">
                <X size={18} />
              </button>
            <div id="dose-title" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 12, color: COLORS.tealDeep }}>
              Your readings and what to change/add
            </div>

            {actionable.length === 0 && (
              <div
                style={{
                  background: COLORS.aquaSoft,
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <CheckCircle2 size={20} color={COLORS.tealDeep} />
                <span style={{ fontSize: 14, color: COLORS.tealDeep, fontWeight: 500 }}>
                  Everything's in range. No products needed today.
                </span>
              </div>
            )}

            {results.map((r) => (
              <div
                key={r.key}
                style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.sand2}`,
                  borderLeft: `4px solid ${r.rec.status === "high" ? COLORS.coral : r.rec.status === "low" ? COLORS.amber : COLORS.aqua}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}>{r.label}</span>
                  <StatusPill status={r.rec.status} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: r.rec.detail ? 4 : 0 }}>{r.rec.headline}</div>
                {r.rec.brand && (
                  <div style={{ fontSize: 12, color: COLORS.navySoft, marginBottom: 4 }}>{r.rec.brand}</div>
                )}
                {r.rec.detail && <div style={{ fontSize: 13, color: COLORS.navySoft, lineHeight: 1.5 }}>{r.rec.detail}</div>}
              </div>
            ))}

            <div
              style={{
                display: "flex",
                gap: 10,
                background: COLORS.sand2,
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
              }}
            >
              <AlertTriangle size={18} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: COLORS.navySoft, lineHeight: 1.6 }}>
                Amounts are estimates based on common product strengths — the exact figure varies by brand, so check your
                product's label. Add chemicals one at a time, never mix them together, add acid to water (not the
                reverse), and keep the pump running while dosing. Wait 4–6 hours and retest before dosing again.
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
