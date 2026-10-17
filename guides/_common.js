// Default controls shared by every ship guide (ship.html shows these under "General controls").
// Keybinds are the 4.10.2 keyboard/mouse defaults as listed by starcitizenhelp.com. CIG moves
// bindings between patches, so treat in-game Options → Keybindings as the authority.

window.SHIP_GUIDE_COMMON = {
  patch: "4.10.2",
  source: "https://starcitizenhelp.com/game-guides/keybinds",
  sections: [
    {
      title: "Getting going",
      rows: [
        ["Interaction mode (use seats, doors, screens)", "F (hold) + click", ""],
        ["Flight / systems ready", "Right Alt + R", "Some guides list plain R. Check in-game."],
        ["Power everything on/off", "U", ""],
        ["Power thrusters / shields / weapons", "I / O / P", "Toggle each system on its own"],
        ["Exit seat", "Y", ""],
        ["Eject", "Right Alt + Y", "Only in ships with ejection seats"],
        ["Headlights", "L", ""],
        ["mobiGlas / Map", "F1 / F2", ""],
      ],
    },
    {
      title: "Takeoff, landing, docking",
      rows: [
        ["Request landing / takeoff (ATC)", "Left Alt + N", "Opens the hangar or assigns a pad"],
        ["Landing gear (landing system)", "N", ""],
        ["VTOL", "K", "Ships that have VTOL thrusters"],
        ["Docking", "Right Alt + N", "Docking camera: hold 0"],
      ],
    },
    {
      title: "Flight & travel",
      rows: [
        ["Boost", "Left Shift", ""],
        ["Decoupled mode", "C (tap)", ""],
        ["Cruise control", "Left Alt + C", ""],
        ["Speed limiter up / down", "Left Alt + Wheel Up / Down", ""],
        ["Switch master mode (SCM ↔ NAV)", "B (hold)", "Quantum travel needs NAV mode"],
        ["Quantum travel", "Set route in Map (F2), switch to NAV, then hold Left Click", ""],
        ["Free look / look behind", "Z (hold) / , (hold)", ""],
        ["Third-person camera", "F4", ""],
      ],
    },
    {
      title: "Power priority",
      rows: [
        ["Weapons more / less", "F5 / Left Alt + F5", ""],
        ["Engines more / less", "F6 / Left Alt + F6", ""],
        ["Shields more / less", "F7 / Left Alt + F7", ""],
        ["Reset power", "F8", ""],
      ],
    },
    {
      title: "Combat",
      rows: [
        ["Fire guns", "Left Click", ""],
        ["Next operator mode (guns → missiles → …)", "Middle Click", ""],
        ["Gimbal lock toggle", "G", "In gun mode"],
        ["Arm more missiles / reset", "G / Left Alt + G", "In missile mode"],
        ["Launch missile", "Left Click (tap)", "In missile mode, once locked"],
        ["Cycle missile type", "Wheel Up / Down", "In missile mode"],
        ["Decoy (flares) / noise (chaff)", "H / J", ""],
        ["Lock pinned target 1 / 2 / 3", "1 / 2 / 3", "Pin selected target: Left Alt + 1/2/3"],
        ["Cycle hostile targets", "5", ""],
        ["Unlock target", "Left Alt + T", ""],
        ["Scanning mode / radar ping", "V / Tab (hold)", ""],
      ],
    },
    {
      title: "Turrets",
      rows: [
        ["Aim turret", "Mouse", ""],
        ["Next / previous remote turret", "D / A", "From a remote turret station"],
        ["Leave turret", "Y", ""],
      ],
    },
    {
      title: "Ground vehicles",
      rows: [
        ["Drive / steer", "W S / A D", ""],
        ["Brake", "X (hold)", ""],
        ["Boost", "Left Shift", ""],
        ["Horn", "Space", ""],
        ["Exit vehicle", "Y", ""],
      ],
    },
    {
      title: "Medical beds (any ship)",
      rows: [
        ["Set a ship bed as your respawn", "Get in the bed → interact → 'Set as preferred ICU'", "Bed must be stocked with MedGel. The ship must still exist."],
        ["Log out on your ship", "Lie in a bed → interact → log out", "You wake up aboard next session"],
      ],
    },
  ],
};
