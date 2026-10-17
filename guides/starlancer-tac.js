window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["starlancer-tac"] = {
  summary:
    "A large multicrew gunship and mobile base. Pilot-slaved cannons and missile batteries, manned and remote turrets, an 8-seat infantry bay, two T3 medbeds, 96 SCU cargo, and a snub hangar.",
  features: [
    {
      name: "Pilot weapons",
      what: "Two pilot-slaved cheek turrets, each with a pair of S4 M6A cannons.",
      steps: ["Power weapons on (P) and confirm you're in gun mode.", "Aim with the mouse. Press G to toggle gimbal lock."],
      keys: [["Fire", "Left Click"], ["Gimbal lock", "G"]],
    },
    {
      name: "Missile batteries",
      what: "Four MSD-543 racks (4× S3 Thunderbolt III each) plus two rear-facing remote missile turrets (6× S2 Ignite II each).",
      steps: [
        "Middle Click to switch to missile mode.",
        "Hold your aim on the target until it locks, then press G to arm more missiles.",
        "Tap Left Click to launch.",
        "The rear missile turrets are crew-operated from remote stations.",
      ],
      keys: [["Missile mode", "Middle Click"], ["Arm more", "G"], ["Launch", "Left Click"]],
    },
    {
      name: "Manned side turrets",
      what: "Two crewed turrets, each with 2× S5 CF-557 Galdereen repeaters. This is the ship's heaviest sustained firepower.",
      steps: ["A crew member walks to the turret seat and uses F to sit.", "Aim with the mouse and fire with Left Click.", "Exit with Y."],
      keys: [["Sit", "F"], ["Fire", "Left Click"], ["Exit", "Y"]],
    },
    {
      name: "Remote turrets",
      what: "Dorsal remote turrets with S4 CF-447 Rhino repeaters, operated from crew stations.",
      steps: ["Sit at a remote turret station (F).", "Cycle turrets with D / A.", "Exit with Y."],
      keys: [["Next / prev turret", "D / A"], ["Exit", "Y"]],
    },
    {
      name: "Medical bay",
      what: "Two Tier 3 medical beds (ship max tier T3). They heal serious injuries and can act as a respawn point up to ~50 km away.",
      steps: [
        "Stock the beds with MedGel.",
        "Lie in a bed and interact, then choose 'Set as preferred ICU'.",
        "Respawn only works while the ship exists (not stored or destroyed).",
      ],
      keys: [["Interact", "F"]],
    },
    {
      name: "Infantry bay & ramps",
      what: "8 jump seats, each with a rifle rack, two sealed deployment ramps, and two S1 door guns. Weapon racks hold 10 rifles and 12 pistols.",
      steps: ["Passengers sit with F and stow rifles in the seat racks.", "Open the ramps from the door panels (F). Troops can man the door guns during deployment."],
      keys: [["Interact", "F"]],
    },
    {
      name: "Snub hangar",
      what: "Dorsal hangar sized for the Mirai Fury (not included). The Pitbull was designed to the Fury's footprint and may fit (unverified).",
      steps: ["Land the snub in the dorsal hangar.", "Launch: board the snub, run flight ready, and lift out."],
      keys: [],
    },
    {
      name: "Cargo & vehicle bay",
      what: "96 SCU across two grids, with 16 SCU max container size. The aft bay can deploy and retrieve ground vehicles.",
      steps: ["Load at a cargo terminal or by hand or tractor beam.", "Drive ground vehicles into the aft bay to carry them."],
      keys: [["Tractor beam distance", "Wheel Up / Down"]],
    },
    {
      name: "Habitation",
      what: "8 bunks, personal lockers, two bathrooms, and a mess hall.",
      steps: ["Log out in a bunk to wake up aboard next session."],
      keys: [],
    },
  ],
  cheatsheet: [
    ["Board / sit", "F", "Exterior elevator to enter"],
    ["Flight ready", "Right Alt + R", ""],
    ["Request takeoff/landing", "Left Alt + N", ""],
    ["Missile mode", "Middle Click", ""],
    ["Decoy / noise", "H / J", ""],
    ["Shields priority", "F7", "144k HP of quadrant shields"],
    ["Dock (collars)", "Right Alt + N", "Two S1 docking collars"],
  ],
  sources: ["https://starcitizen.tools/Starlancer_TAC", "https://starcitizen.tools/Medical_bed"],
};
