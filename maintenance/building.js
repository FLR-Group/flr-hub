/* ============================================================================
   FLR Hub: Maintenance. The FLR building (Unit 25, Monkspath Business Park), traced from the fire plan on the office wall
   (the user's photos, 17 Nov 2026). Each map is in its own units (its viewBox); a pin is kept as a fraction of the map's
   width and height, so the drawing can be redrawn more neatly without moving anyone's pins.

   Room names are the ones staff use (the user's list), matched to the fire plan's rooms by guess where the plan has an
   older name: The Stadium = Library, Will's Office = Office, Back Office = The Hub, Back Kitchen = Operations Welfare
   Area, Golf Sim = The Greenhouse, the separate unit = Unit 25A. Rooms on the list that the plan doesn't show (Pool
   Table) have no shape. Shapes later in a map's list sit on top, so small rooms inside big ones come after them.
   ========================================================================== */
window.FLR_BUILDING = {
  maps: [
    {
      id: 'ground', name: 'Ground floor', w: 1600, h: 985,
      outline: [[150, 195], [1535, 195], [1535, 905], [150, 905]],
      rooms: [
        { name: 'Showroom', label: [585, 470], poly: [[400, 195], [765, 195], [765, 555], [1015, 555], [1015, 905], [640, 905], [640, 730], [400, 730]] },
        { name: 'The Forum', rect: [765, 195, 250, 360] },
        { name: 'Reception', label: [275, 560], poly: [[150, 300], [400, 300], [400, 905], [150, 905]] },
        { name: 'Downstairs Toilet (Men’s)', short: 'WC', rect: [165, 195, 120, 105] },
        { name: 'Downstairs Toilet (Women’s)', short: 'WC', rect: [285, 195, 115, 105] },
        { name: 'Golf Sim', rect: [400, 730, 240, 175] },
        { name: 'Warehouse', rect: [1015, 195, 520, 465] },
        { name: 'Store', rect: [1015, 660, 145, 245] },
        { name: 'Carpet Racking', short: 'Carpets', rect: [1160, 660, 250, 245] },
        { name: 'Adhesive Store', short: 'Adhesive', rect: [1410, 660, 125, 245] },
        { name: 'Back Door', rect: [1470, 598, 65, 62], small: true },
      ],
      stairs: [[480, 575, 160, 125], [1100, 205, 210, 105]],
      doors: [{ at: [150, 360], label: 'Entrance', side: 'left' }],
    },
    {
      id: 'first', name: 'First floor', w: 1600, h: 1000,
      outline: [[65, 185], [1535, 185], [1535, 915], [65, 915]],
      rooms: [
        { name: 'Landing', label: [640, 520], poly: [[305, 350], [470, 350], [470, 385], [785, 385], [785, 715], [325, 715], [325, 455], [305, 455]] },
        { name: 'The Bridge', rect: [80, 185, 225, 265] },
        { name: 'Toilet & Shower', short: 'Shower', rect: [305, 185, 165, 165] },
        { name: 'The Core', rect: [470, 185, 315, 200] },
        { name: 'The Innovatory', rect: [785, 385, 205, 260] },
        { name: 'Back Kitchen', label: [1100, 470], rect: [990, 185, 220, 460] },
        { name: 'Back Kitchen Toilet', short: 'WC', rect: [995, 190, 85, 110] },
        { name: 'The Archive', rect: [770, 645, 380, 95] },
        { name: 'The Point', rect: [65, 715, 340, 200] },
        { name: 'The Stadium', rect: [405, 715, 365, 200] },
        { name: 'The Exchange', rect: [770, 740, 215, 175] },
        { name: 'Will’s Office', rect: [985, 740, 165, 175] },
        { name: 'Back Office', rect: [1150, 660, 385, 255] },
      ],
      voids: [[65, 455, 260, 260], [1210, 185, 325, 475]],   // open to the floor below: drawn crossed, not a room
      stairs: [[410, 575, 140, 135]],
      blank: [[785, 185, 205, 200]],   // a room the plan doesn't name
    },
    {
      id: 'unit', name: 'Unit 25A', w: 1600, h: 741,
      outline: [[60, 50], [1495, 50], [1495, 645], [630, 645], [630, 345], [60, 345]],
      rooms: [
        { name: 'Showroom 25a', short: 'Showroom', label: [230, 230], poly: [[70, 60], [630, 60], [630, 335], [70, 335]] },
        { name: 'Showroom 25a', short: 'Showroom', rect: [630, 60, 210, 385], nolabel: true },
        { name: 'Kitchen 25a', short: 'Kitchen', rect: [395, 60, 125, 110] },
        { name: 'Toilet 25a', short: 'WC', rect: [520, 60, 105, 65] },
        { name: 'Storage 25a', short: 'Storage', rect: [640, 455, 200, 185] },
        { name: 'Warehouse 25a', rect: [845, 60, 650, 580] },
      ],
      racks: [[960, 65, 405, 50], [1145, 115, 50, 75], [852, 345, 160, 55], [852, 400, 48, 190], [1025, 470, 52, 170], [852, 580, 510, 55]],
    },
  ],
};
