window.SHIP_GUIDES = window.SHIP_GUIDES || {};
window.SHIP_GUIDES["pitbull"] = {
  summary: "A tiny, heavily armed snub fighter for close-range brawls. \"More guns than common sense.\" No quantum drive.",
  features: [
    {
      name: "Six guns",
      what: "2× S2 CF-227 Badger plus 4× S1 CF-117 Bulldog repeaters on gimbals (~1,531 DPS).",
      steps: ["Close the distance. Repeaters are strongest at short range.", "Press G to toggle gimbal lock."],
      keys: [["Fire", "Left Click"], ["Gimbal lock", "G"]],
    },
    {
      name: "Missiles under retractable wings",
      what: "6× S1 Marksman I on MSD-111 racks.",
      steps: ["Middle Click for missile mode, arm with G, and tap Left Click to launch."],
      keys: [["Missile mode", "Middle Click"], ["Arm", "G"]],
    },
    {
      name: "Folding wings",
      what: "Width folds from 6.13 m to 3.9 m for storage.",
      steps: ["Designed to fit the Mirai Fury's footprint, so try it in the Starlancer TAC's snub hangar."],
      keys: [],
    },
    {
      name: "Defenses",
      what: "S1 WEB shield (2,160 HP) over a 1,950 HP hull. Drake decoy and noise launchers.",
      steps: ["Strike and break away. It won't survive a long exchange."],
      keys: [["Decoy / noise", "H / J"]],
    },
  ],
  cheatsheet: [
    ["Flight ready", "Right Alt + R", ""],
    ["Boost", "Left Shift", "Watch fuel: only 0.5 hydrogen"],
    ["Return to mothership", "Left Alt + N", "Request landing if the carrier supports it"],
  ],
  sources: ["https://starcitizen.tools/Pitbull"],
};
