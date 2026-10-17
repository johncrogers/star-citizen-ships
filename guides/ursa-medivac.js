window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["ursa-medivac"] = {
  summary: "An armored ground ambulance with a Tier 3 medical bed. It works as a mobile respawn point for ground ops.",
  features: [
    {
      name: "Tier 3 medical bed",
      what: "Treats severe injuries, and can be set as your respawn point within ~50 km.",
      steps: [
        "Stock the bed with MedGel. A respawn costs about half a T3 bed's capacity.",
        "Lie in the bed and interact, then choose 'Set as preferred ICU'.",
        "The Ursa has to stay spawned. If it's stored or destroyed, you respawn at your home location instead.",
        "Load patients via the rear ramp.",
      ],
      keys: [["Interact", "F"]],
    },
    {
      name: "Remote turret",
      what: "Roof turret with 2× S1 CF-117 Bulldog repeaters, operated from inside. It's for light self-defense.",
      steps: ["Sit at the turret station (F).", "Aim with the mouse and fire with Left Click.", "Exit with Y."],
      keys: [["Fire", "Left Click"], ["Exit", "Y"]],
    },
    {
      name: "Driving",
      what: "Max speed ~24 m/s, reverse ~12 m/s. Crew of 1–3.",
      steps: ["Sit in the driver seat (F) and power on.", "Drive with WASD. Hold X to brake."],
      keys: [["Brake", "X (hold)"], ["Boost", "Left Shift"], ["Headlights", "L"]],
    },
    {
      name: "Storage",
      what: "Small rear cargo grid and weapon racks (2 rifles, 2 pistols).",
      steps: ["Stow spare MedGel and med pens here for the team."],
      keys: [],
    },
  ],
  cheatsheet: [
    ["Spawn it", "Ground vehicle terminal (garage / vehicle pad)", "Or drive it out of a ship's vehicle bay"],
    ["Set respawn", "In bed → 'Set as preferred ICU'", ""],
    ["Brake", "X (hold)", ""],
    ["Horn", "Space", ""],
    ["Exit", "Y", ""],
  ],
  sources: ["https://starcitizen.tools/Ursa_Medivac", "https://starcitizen.tools/Medical_bed"],
};
