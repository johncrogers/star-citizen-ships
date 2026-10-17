// Ships I own: { "<ship id>": { "aUEC": "YYYY-MM-DD", "pledge": "YYYY-MM-DD" } }, either or both.
//   aUEC:   bought in-game with aUEC.
//   pledge: bought with real money on the RSI pledge store. Only pledged ships can be upgraded.
// The viewer's "Bought in-game" and "Pledged" checkboxes save to the browser right away. To make
// them permanent (and visible to agents and git), click "Save purchases.js" in the viewer and replace this file.
window.PURCHASES = {};
