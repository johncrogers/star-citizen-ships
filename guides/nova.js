window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["nova"] = {
  summary: "A heavy tank with a long-range S5 cannon, an anti-infantry remote turret, and Firebug energy missiles. Built to hold ground against vehicles and low-flying ships.",
  features: [
    {
      name: "Main cannon",
      what: "An S5 Slayer ballistic cannon. High velocity and accuracy, works against ground and air targets.",
      steps: ["Lead moving targets. Slower air targets are the easiest hits.", "Rearm ammo at a station."],
      keys: [["Fire", "Left Click"]],
    },
    {
      name: "Remote turret",
      what: "2× S2 CF-227 Badger repeaters for infantry and fast movers. They can be swapped for other S2 weapons.",
      steps: ["The gunner takes the gunner station (F) and controls the turret."],
      keys: [["Sit", "F"], ["Fire", "Left Click"]],
    },
    {
      name: "Firebug missiles",
      what: "Self-recharging energy missile launchers that saturate an area with explosive blasts.",
      steps: ["Middle Click for missile mode, then lock and launch.", "They recharge over time, so there's no rearming."],
      keys: [["Missile mode", "Middle Click"], ["Launch", "Left Click"]],
    },
    {
      name: "Armor & positioning",
      what: "127,600 HP hull of composite armor, plus Second Skin shields (2,160 HP).",
      steps: ["Keep the front toward the enemy. The rear entry and tracks are the weak spots.", "Use terrain for cover against aircraft."],
      keys: [],
    },
    {
      name: "Crew",
      what: "Up to 3 crew: driver, gunner, and support.",
      steps: ["Solo is possible, but a gunner on the turret makes it far more dangerous."],
      keys: [],
    },
  ],
  cheatsheet: [
    ["Spawn it", "Ground vehicle terminal", "Or deploy from a Hercules C2/M2"],
    ["Drive", "W S / A D", "Max ~25 m/s"],
    ["Brake", "X (hold)", ""],
    ["Exit", "Y", ""],
  ],
  sources: ["https://starcitizen.tools/Nova", "https://starcitizen.tools/M2_Hercules_Starlifter"],
};
