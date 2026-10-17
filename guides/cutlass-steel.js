window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["cutlass-steel"] = {
  summary: "A troop dropship built on the Cutlass. 18 jump seats, a manned turret, a co-pilot remote turret, door guns, and a heavy missile load. No cargo.",
  features: [
    {
      name: "Troop bay",
      what: "18 jump seats, each with a weapon rack (22 rifle racks total). There's a rear ramp, plus large side doors for EVA, rescue, and salvage.",
      steps: ["Troops sit with F and rack their rifles.", "Open the ramp or side doors from the door panels (F).", "The pilot holds a hover with VTOL (K) for drops."],
      keys: [["Interact", "F"], ["VTOL", "K"]],
    },
    {
      name: "Manned turret",
      what: "An S5 turret with 2× S3 gimbals (CF-337 Panther or Mantis GT-220).",
      steps: ["A gunner sits at the turret (F).", "Aim with the mouse and fire with Left Click.", "Exit with Y."],
      keys: [["Fire", "Left Click"], ["Exit", "Y"]],
    },
    {
      name: "Co-pilot remote turret",
      what: "An S4 remote turret with 2× S2 CF-227 Badger repeaters, run from the co-pilot seat.",
      steps: ["The co-pilot sits and switches to the remote turret."],
      keys: [["Next / prev turret", "D / A"]],
    },
    {
      name: "Door guns",
      what: "Five S1 mounts (two left, two center, one rear) for troops to suppress the landing zone.",
      steps: ["A trooper interacts with a door gun mount (F)."],
      keys: [["Use", "F"]],
    },
    {
      name: "Missiles",
      what: "8× S2 Tempest II and 8× S3 Arrester III.",
      steps: ["Middle Click for missile mode, arm with G, and tap Left Click to launch."],
      keys: [["Missile mode", "Middle Click"], ["Arm", "G"]],
    },
    {
      name: "Utilities",
      what: "Two S1 tractor beams, a quantum interdiction (QED) generator, a pair of beds, a kitchenette, and lockers.",
      steps: ["Use the tractor beams for pulling crates or bodies during rescue."],
      keys: [["Tractor distance", "Wheel Up / Down"]],
    },
  ],
  cheatsheet: [
    ["Flight ready", "Right Alt + R", ""],
    ["VTOL (for drops)", "K", ""],
    ["Landing gear", "N", ""],
    ["Decoy / noise", "H / J", ""],
  ],
  sources: ["https://starcitizen.tools/Cutlass_Steel"],
};
