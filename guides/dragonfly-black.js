window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["dragonfly-black"] = {
  summary: "An open-canopy gravlev snub that works both on the ground and in space. It's fast, stealthy, and fragile.",
  features: [
    {
      name: "Ground / zero-G modes",
      what: "A modular chassis that switches between ground (hover), zero-G, and compact configurations.",
      steps: [
        "The mode switch has its own keybind. I couldn't confirm the default, so look it up under Options → Keybindings → Vehicles and fill it in here.",
        "Use ground mode for rough terrain and zero-G mode in space.",
      ],
      keys: [["Mode switch", "Unverified. Check Keybindings"]],
    },
    {
      name: "Guns",
      what: "2× S1 Havoc scatterguns on VariPuck gimbals (~749 DPS). Short-range shotguns.",
      steps: ["Get close. Scatterguns lose effectiveness at range.", "Press G to toggle gimbal lock."],
      keys: [["Fire", "Left Click"], ["Gimbal lock", "G"]],
    },
    {
      name: "Rear passenger seat",
      what: "A rear-facing second seat for a passenger watching your back. It's unclear whether the passenger can fire.",
      steps: ["Passenger boards with F on the rear seat."],
      keys: [["Board", "F"]],
    },
    {
      name: "Stealth",
      what: "Very low signature: IR −73%, EM −60%.",
      steps: ["Power down unneeded systems (U/I/O/P) to stay even quieter."],
      keys: [],
    },
    {
      name: "Countermeasures",
      what: "Flare and chaff launchers.",
      steps: ["Pop decoys when a missile lock warning sounds."],
      keys: [["Decoy / noise", "H / J"]],
    },
  ],
  cheatsheet: [
    ["Board", "F", "Wear a helmet: the canopy is open"],
    ["Flight ready", "Right Alt + R", ""],
    ["Boost", "Left Shift", ""],
    ["Carry it", "Cutlass, Caterpillar, Kraken bay", "No quantum drive"],
  ],
  sources: ["https://starcitizen.tools/Dragonfly_Black"],
};
