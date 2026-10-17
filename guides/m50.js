window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["m50"] = {
  summary: "Origin's premier racer: \"a power plant with a cockpit attached.\" It has the top SCM speed on the list, light weapons, and a small quantum tank.",
  features: [
    {
      name: "Speed",
      what: "SCM 280 m/s, max 1,575 m/s, 200°/s roll.",
      steps: ["Prioritize engines (F6) when racing or running away."],
      keys: [["Boost", "Left Shift"], ["Engines priority", "F6"]],
    },
    {
      name: "Weapons",
      what: "2× S2 CF-227 Badger repeaters plus 2× S1 Marksman I missiles.",
      steps: ["It's for self-defense. Use speed to disengage."],
      keys: [["Fire", "Left Click"], ["Missile mode", "Middle Click"]],
    },
    {
      name: "Shield",
      what: "One S1 Targa shield (1,920 HP) over a 2,281 HP hull. Noise launchers ×2.",
      steps: [],
      keys: [["Noise", "J"]],
    },
    {
      name: "Quantum travel",
      what: "S1 LightFire drive: 0.6 quantum fuel, ~122 Gm range, 5.3 s spool.",
      steps: ["Top up quantum fuel at every stop. A long jump can leave you stranded."],
      keys: [["NAV mode", "B (hold)"], ["Engage QT", "Left Click (hold)"]],
    },
  ],
  cheatsheet: [
    ["Flight ready", "Right Alt + R", ""],
    ["Decoupled", "C", "For drifting turns"],
    ["Speed limiter", "Left Alt + Wheel", ""],
  ],
  sources: ["https://starcitizen.tools/M50"],
};
