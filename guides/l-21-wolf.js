window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["l-21-wolf"] = {
  summary: "An agile single-seat light fighter with a pair of retractable S4 gatlings. Fast rolls (210°/s), light armor.",
  features: [
    {
      name: "Retractable S4 gatlings",
      what: "Two gimbaled S4 Relentless L-21 ballistic gatlings that stow out of view when weapons are off. ~1,995 DPS.",
      steps: [
        "Power weapons on (P) to deploy the guns.",
        "Ballistic guns have limited ammo. Rearm at a station.",
        "Press G to toggle gimbal lock.",
      ],
      keys: [["Weapons power", "P"], ["Fire", "Left Click"], ["Gimbal lock", "G"]],
    },
    {
      name: "Missiles",
      what: "Two S1 racks (wiki says up to 8× S1, and the default loadout shows 4 Marksman I).",
      steps: ["Middle Click for missile mode.", "Lock the target, press G to arm, and tap Left Click to fire."],
      keys: [["Missile mode", "Middle Click"], ["Arm", "G"], ["Launch", "Left Click"]],
    },
    {
      name: "Defenses",
      what: "2× S1 shields (4,320 HP) and 8,523 HP hull. Decoy and noise launchers.",
      steps: ["Stay at range and use your roll rate to dodge. Prioritize shields (F7) when under fire."],
      keys: [["Decoy / noise", "H / J"], ["Shields priority", "F7"]],
    },
    {
      name: "Quantum travel",
      what: "S1 FoxFire drive: 0.6 quantum fuel, ~102 Gm range, 4.8 s spool.",
      steps: ["Check fuel before long jumps and refuel at stations."],
      keys: [["NAV mode", "B (hold)"], ["Engage QT", "Left Click (hold)"]],
    },
  ],
  cheatsheet: [
    ["Flight ready", "Right Alt + R", ""],
    ["Boost", "Left Shift", ""],
    ["Decoupled", "C", "For strafing turns"],
    ["Lock target", "1", ""],
  ],
  sources: ["https://starcitizen.tools/L-21_Wolf", "https://starcitizen.tools/Wikelo"],
};
