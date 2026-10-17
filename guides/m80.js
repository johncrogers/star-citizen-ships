window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["m80"] = {
  summary: "Origin's first heavy fighter: concealable S5 and S4 guns, a heavy missile load, and strong shields for sustained fights.",
  features: [
    {
      name: "Concealable guns",
      what: "2× S5 CF-557 Galdereen and 2× S4 CF-447 Rhino repeaters on gimbals (~4,091 DPS). The weapons are fully concealable.",
      steps: ["Power weapons on (P) to deploy them.", "Press G to toggle gimbal lock."],
      keys: [["Weapons power", "P"], ["Fire", "Left Click"], ["Gimbal lock", "G"]],
    },
    {
      name: "Missiles",
      what: "An MSD-423 rack with 2× S3 Thunderbolt III, plus an MSD-481 rack with 8× S1 Pioneer I.",
      steps: ["Middle Click for missile mode.", "Cycle missile type with the mouse wheel.", "Lock the target, arm with G, and tap Left Click."],
      keys: [["Missile mode", "Middle Click"], ["Cycle type", "Wheel"], ["Arm", "G"]],
    },
    {
      name: "Shields & armor",
      what: "2× S2 Chimalli shields (20,000 HP), 17,000 HP hull, high deflection (physical 41, energy 32).",
      steps: ["Built to trade hits. Keep shields powered (F7) in long engagements."],
      keys: [["Shields priority", "F7"], ["Decoy / noise", "H / J"]],
    },
    {
      name: "Internal repairs",
      what: "Essential components are inside the ship for direct repair. Lower-priority parts are external.",
      steps: ["Carry a multitool with a repair attachment to fix components mid-sortie."],
      keys: [],
    },
    {
      name: "Storage",
      what: "2 SCU cargo, a shelf for 3× ⅛ SCU boxes, and racks for two S2–4 weapons and three pistols or medguns.",
      steps: [],
      keys: [],
    },
  ],
  cheatsheet: [
    ["Flight ready", "Right Alt + R", ""],
    ["NAV mode / QT", "B (hold) / Left Click (hold)", "S2 drive, ~387 Gm range"],
    ["Boost", "Left Shift", ""],
  ],
  sources: ["https://starcitizen.tools/M80"],
};
