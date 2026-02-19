import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const QuoteEditor = () => {
  const [dimensions, setDimensions] = useState({ width: 0, length: 0, height: 16 });
  const [studSize, setStudSize] = useState('2x6');
  const [frameType, setFrameType] = useState('stud');
  const [postSize, setPostSize] = useState('2x6 3ply');
  const [postDiameter, setPostDiameter] = useState('24"');
  const [config, setConfig] = useState({
    management: 0.07, pst: 0.07, waste: 0.05, profit: 0.25, gst: 0.05,
    laborPerSqft: 10, toolExpense: 1, drafting: 1, studSpacing: 16,
    topPlates: 2, extraTopPlates: 4, roofPitchRise: 4, roofPitchRun: 12, overhang: 0
  });
  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', qty: 0, unit: 0, category: 'framing_lumber' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(null);

  const loadDefaultPrices = () => {
    const saved = localStorage.getItem('timbilt_default_prices');
    return saved ? JSON.parse(saved) : {};
  };
  const [defaultPrices, setDefaultPrices] = useState(loadDefaultPrices());

  const floorArea = (dimensions.width || 0) * (dimensions.length || 0);
  const perimeter = 2 * ((dimensions.width || 0) + (dimensions.length || 0));
  const wallAreaRect = perimeter * ((dimensions.height || 0) + 1);
  const roofPitch = config.roofPitchRise / config.roofPitchRun;
  const angleRad = Math.atan(roofPitch);
  const cosAngle = Math.cos(angleRad);
  const run = (dimensions.width || 0) / 2;
  const rise = run * roofPitch;
  const rafterLen = (run / cosAngle) + config.overhang;
  const roofArea = rafterLen * (dimensions.length || 0) * 2;
  const gableArea = (dimensions.width || 0) * rise * 2;
  const wallArea = wallAreaRect;

  // Post frame: price per linear foot by ply = (height + 6) * plyRate
  const plyRates = {
    '2x6 3ply': 3.85,
    '2x6 4ply': 4.9,
    '2x8 4ply': 7.4,
    '2x8 5ply': 9.25,
    '2x8 6ply': 11.1,
  };

  // Sub-item base prices (per unit / per post)
  const subItemBasePrices = {
    shipment: { '24"': 3,     '30"': 3     },
    redi:     { '24"': 36,    '30"': 63    },
    concrete: { '24"': 48,    '30"': 84    },
    limestone:{ '24"': 33.48, '30"': 40.3  },
  };

  // Compute the base post price: (height + 6) * plyRate
  const calcPostBasePrice = (h, ps) => (h + 6) * (plyRates[ps] || 0);

  // Compute the combined post unit price = base + sum of enabled sub-item prices
  const calcPostUnitPrice = (currentItems, h, ps, dia) => {
    const base = calcPostBasePrice(h, ps);
    const subIds = { 102: 'shipment', 103: 'redi', 104: 'concrete', 105: 'limestone' };
    const addon = Object.entries(subIds).reduce((sum, [id, key]) => {
      const item = currentItems.find(i => i.id === Number(id));
      return sum + (item && item.enabled ? (subItemBasePrices[key][dia] || 0) : 0);
    }, 0);
    return base + addon;
  };

  const studPrices = {
    '2x6': { studs: 11.26, topPlates: 11.26, extraTopPlates: 11.26, bottomPlates: 24.19 },
    '2x8': { studs: 16.19, topPlates: 16.19, extraTopPlates: 16.19, bottomPlates: 32.40 }
  };

  const formulas = {
    1:   () => Math.ceil((perimeter * 12) / config.studSpacing),
    101: () => Math.ceil((perimeter * 12) / config.studSpacing), // Post — same formula as studs
    2:   () => Math.ceil(perimeter / 16) * config.topPlates,
    3:   () => config.extraTopPlates,
    4:   () => Math.ceil(perimeter / 16),
    5:   () => 0,
    6:   () => 0,
    7:   () => Math.ceil(((dimensions.height || 0) + 1)/2 * (perimeter / 16)),
    8:   () => Math.ceil(((dimensions.height || 0) + 1)/2 * (perimeter / 16)),
    9:   () => Math.ceil(Math.ceil(rafterLen / 2) * (dimensions.length / 16) * 2 * 1.7),
    10:  () => 0,
    11:  () => Math.ceil(perimeter / 4),
    12:  () => Math.ceil((Math.ceil((perimeter * 12) / config.studSpacing) * 30) / 2000),
    13:  () => Math.ceil((Math.ceil((perimeter * 12) / config.studSpacing) * 35) / 2000),
    14:  () => 0, 15: () => 0,
    16:  () => Math.ceil(perimeter / 50),
    17:  () => 2, 18: () => 1, 19: () => 1,
    20:  () => Math.ceil(roofArea),
    21:  () => Math.ceil(wallAreaRect + gableArea),
    22:  () => Math.ceil(dimensions.length / 10),
    23:  () => Math.ceil(dimensions.length / 10),
    24:  () => Math.ceil(perimeter / 10),
    25:  () => Math.ceil(perimeter / 10),
    26:  () => Math.ceil(perimeter / 16),
    27:  () => Math.ceil(perimeter / 10),
    28:  () => 4, 29: () => 4,
    30:  () => Math.ceil((dimensions.length * 0.70) / 16) + 2,
    31:  () => 4,
    32:  () => Math.ceil(perimeter / 20),
    33:  () => Math.ceil(perimeter / 10),
    34:  () => Math.ceil((dimensions.length * 2) / 20),
    35:  () => 5, 36: () => 1, 37: () => 2,
    38:  () => Math.ceil(wallAreaRect * 0.94),
    39:  () => Math.ceil(floorArea),
    40:  () => Math.ceil(perimeter / 10),
    41:  () => Math.ceil(perimeter / 16),
    42:  () => 2,
    43:  () => Math.ceil(perimeter / 10),
    44:  () => Math.ceil(Math.ceil(wallAreaRect * 0.94) / 1000),
    45:  () => Math.ceil(Math.ceil(wallAreaRect * 0.94) / 1000),
    46:  () => 2, 47: () => 6,
    48:  () => Math.ceil(wallAreaRect * 0.94),
    49:  () => Math.ceil(wallAreaRect * 0.94),
    50:  () => Math.ceil(floorArea),
    51:  () => Math.ceil(floorArea),
    52:  () => Math.ceil(wallAreaRect * 0.1),
    53:  () => 0, 54: () => 0, 55: () => 0, 56: () => 1,
    57:  () => Math.ceil(wallAreaRect),
    58:  () => Math.ceil(floorArea),
    59:  () => Math.ceil(perimeter / 10),
    60:  () => Math.ceil(perimeter / 16),
    61:  () => 1, 62: () => 1, 63: () => 1, 64: () => 1,
    65:  () => 1, 66: () => 1, 67: () => 1, 68: () => 1,
    69:  () => Math.ceil(floorArea),
    70:  () => 1, 71: () => 1, 72: () => 1, 73: () => 0, 74: () => 0
  };

  // IDs that are Post Frame only (hidden in Stud mode)
  const POST_FRAME_IDS = [101, 102, 103, 104, 105];
  // The sub-items under Post (indented visually)
  const POST_SUB_IDS = [102, 103, 104, 105];

  useEffect(() => {
    if (items.length > 0) return;
    const cp = studPrices[studSize];
    const gp = (id, base) => defaultPrices[id] !== undefined ? defaultPrices[id] : base;
    const h = dimensions.height || 16;
    const dia = postDiameter;
    const shipPrice     = subItemBasePrices.shipment[dia];
    const rediPrice     = subItemBasePrices.redi[dia];
    const concretePrice = subItemBasePrices.concrete[dia];
    const limestonePrice= subItemBasePrices.limestone[dia];
    // All sub-items enabled by default, so initial post price includes all of them
    const postBase = calcPostBasePrice(h, postSize);
    const postInitUnit = postBase + shipPrice + rediPrice + concretePrice + limestonePrice;

    setItems([
      // ── STUD frame item (hidden in post mode) ──
      { id: 1,   category: 'framing_lumber', name: `${studSize} Studs 16'`, qty: 135, unit: gp(1, cp.studs), baseUnit: cp.studs, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      // ── POST frame items (hidden in stud mode) ──
      { id: 101, category: 'framing_lumber', name: `Post (${postSize})`,    qty: 135, unit: postInitUnit, baseUnit: postBase, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false, postFrameOnly: true },
      { id: 102, category: 'framing_lumber', name: 'Shipment',              qty: 1,   unit: shipPrice,     baseUnit: shipPrice,     enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false, postFrameOnly: true, isPostSub: true, subKey: 'shipment' },
      { id: 103, category: 'framing_lumber', name: 'Redi',                  qty: 1,   unit: rediPrice,     baseUnit: rediPrice,     enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false, postFrameOnly: true, isPostSub: true, subKey: 'redi' },
      { id: 104, category: 'framing_lumber', name: 'Concrete',              qty: 1,   unit: concretePrice, baseUnit: concretePrice, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false, postFrameOnly: true, isPostSub: true, subKey: 'concrete' },
      { id: 105, category: 'framing_lumber', name: 'Limestone',             qty: 1,   unit: limestonePrice,baseUnit: limestonePrice,enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false, postFrameOnly: true, isPostSub: true, subKey: 'limestone' },
      // ── Rest ──
      { id: 2,   category: 'framing_lumber', name: 'Top Plates',                 qty: 27,   unit: gp(2,  cp.topPlates),      baseUnit: cp.topPlates,      enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 3,   category: 'framing_lumber', name: 'Extra Top Plates',           qty: 14,   unit: gp(3,  cp.extraTopPlates), baseUnit: cp.extraTopPlates, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 4,   category: 'framing_lumber', name: 'Bottom Plates',              qty: 11,   unit: gp(4,  cp.bottomPlates),   baseUnit: cp.bottomPlates,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 5,   category: 'framing_lumber', name: 'Headers',                    qty: 95,   unit: gp(5,  7.10),  baseUnit: 7.10,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 6,   category: 'framing_lumber', name: 'LVL Header Material',        qty: 0,    unit: gp(6,  50.00), baseUnit: 50.00,  enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 7,   category: 'framing_lumber', name: 'Outside Wall Strapping',     qty: 90,   unit: gp(7,  8.59),  baseUnit: 8.59,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 8,   category: 'framing_lumber', name: 'Inside Wall Strapping',      qty: 90,   unit: gp(8,  5.39),  baseUnit: 5.39,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 9,   category: 'framing_lumber', name: 'Roof Strapping',             qty: 122,  unit: gp(9,  8.59),  baseUnit: 8.59,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 10,  category: 'framing_lumber', name: '3/4" Plywood (bi-fold)',     qty: 0,    unit: gp(10, 85.00), baseUnit: 85.00,  enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 11,  category: 'fasteners',      name: 'Anchor Bolts',               qty: 45,   unit: gp(11, 2.23),  baseUnit: 2.23,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 12,  category: 'fasteners',      name: 'Paslode Nails 2⅜"',          qty: 2,    unit: gp(12, 6.73),  baseUnit: 6.73,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 13,  category: 'fasteners',      name: 'Paslode Nails 3¼"',          qty: 3,    unit: gp(13, 112.50),baseUnit: 112.50, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 14,  category: 'fasteners',      name: 'Exterior Metal Screws',      qty: 6,    unit: gp(14, 0.10),  baseUnit: 0.10,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 15,  category: 'fasteners',      name: 'Interior Metal Screws',      qty: 5,    unit: gp(15, 0.08),  baseUnit: 0.08,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 16,  category: 'fasteners',      name: 'Staples',                    qty: 4,    unit: gp(16, 11.87), baseUnit: 11.87,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 17,  category: 'windows_doors',  name: 'Windows',                    qty: 2,    unit: gp(17, 560.70),baseUnit: 560.70, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false, hasSizing: true, sizes: [{width:3,height:5,qty:1}], totalPerimeter: 0 },
      { id: 18,  category: 'windows_doors',  name: 'Steel Man Door',             qty: 1,    unit: gp(18, 693.00),baseUnit: 693.00, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false, hasSizing: true, sizes: [{width:3,height:7,qty:1}], totalPerimeter: 0 },
      { id: 19,  category: 'windows_doors',  name: 'Door Handle',                qty: 1,    unit: gp(19, 89.99), baseUnit: 89.99,  enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 20,  category: 'exterior_metal', name: '28GA Exterior Roof Metal',   qty: 2199, unit: gp(20, 1.21),  baseUnit: 1.21,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 21,  category: 'exterior_metal', name: '28GA Exterior Wall Metal',   qty: 3593, unit: gp(21, 1.21),  baseUnit: 1.21,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 22,  category: 'exterior_metal', name: 'Ridge Cap',                  qty: 5,    unit: gp(22, 28.86), baseUnit: 28.86,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 23,  category: 'exterior_metal', name: 'Ridge Flex O-Vent',          qty: 5,    unit: gp(23, 21.64), baseUnit: 21.64,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 24,  category: 'exterior_metal', name: 'Drip Edge',                  qty: 3,    unit: gp(24, 8.77),  baseUnit: 8.77,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 25,  category: 'exterior_metal', name: 'Fascia',                     qty: 14,   unit: gp(25, 18.28), baseUnit: 18.28,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 26,  category: 'exterior_metal', name: 'Base Flashing',              qty: 17,   unit: gp(26, 9.38),  baseUnit: 9.38,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 27,  category: 'exterior_metal', name: 'Eave Flashing',              qty: 14,   unit: gp(27, 18.28), baseUnit: 18.28,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 28,  category: 'exterior_metal', name: "Gable Flashing 10'",         qty: 4,    unit: gp(28, 35.97), baseUnit: 35.97,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 29,  category: 'exterior_metal', name: "Gable Flashing 12'",         qty: 4,    unit: gp(29, 35.97), baseUnit: 35.97,  enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 30,  category: 'exterior_metal', name: 'Inside Corner',              qty: 24,   unit: gp(30, 11.62), baseUnit: 11.62,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 31,  category: 'exterior_metal', name: 'Outside Corner',             qty: 4,    unit: gp(31, 24.42), baseUnit: 24.42,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 32,  category: 'exterior_metal', name: 'Flat Stock',                 qty: 17,   unit: gp(32, 18.00), baseUnit: 18.00,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 33,  category: 'exterior_metal', name: 'J Channel',                  qty: 10,   unit: gp(33, 9.66),  baseUnit: 9.66,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 34,  category: 'exterior_metal', name: 'Foamies',                    qty: 32,   unit: gp(34, 1.60),  baseUnit: 1.60,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 35,  category: 'exterior_trim',  name: 'Door Jamb 11.25"',           qty: 5,    unit: gp(35, 35.07), baseUnit: 35.07,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 36,  category: 'exterior_trim',  name: 'Wind / Door Trims 4x8',      qty: 1,    unit: gp(36, 112.12),baseUnit: 112.12, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 37,  category: 'exterior_trim',  name: '7.25 Header Trim',           qty: 2,    unit: gp(37, 33.39), baseUnit: 33.39,  enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 38,  category: 'interior_metal', name: 'Interior White Metal',       qty: 2880, unit: gp(38, 1.17),  baseUnit: 1.17,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 39,  category: 'interior_metal', name: 'Interior White Ceiling',     qty: 2000, unit: gp(39, 1.17),  baseUnit: 1.17,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 40,  category: 'interior_metal', name: 'Interior J Channel',         qty: 10,   unit: gp(40, 9.66),  baseUnit: 9.66,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 41,  category: 'interior_metal', name: 'Interior Inside Corner',     qty: 16,   unit: gp(41, 27.07), baseUnit: 27.07,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 42,  category: 'interior_metal', name: 'Interior O/H Flatstock',     qty: 2,    unit: gp(42, 46.20), baseUnit: 46.20,  enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 43,  category: 'insulation',     name: 'Sill Gasket',                qty: 2,    unit: gp(43, 15.29), baseUnit: 15.29,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 44,  category: 'insulation',     name: 'House Wrap',                 qty: 4,    unit: gp(44, 111.71),baseUnit: 111.71, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 45,  category: 'insulation',     name: 'Poly',                       qty: 3,    unit: gp(45, 123.19),baseUnit: 123.19, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 46,  category: 'insulation',     name: 'Tuck Tape',                  qty: 2,    unit: gp(46, 13.15), baseUnit: 13.15,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 47,  category: 'insulation',     name: 'Acu Seal',                   qty: 6,    unit: gp(47, 14.09), baseUnit: 14.09,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 48,  category: 'insulation',     name: 'R28 Insulation',             qty: 2016, unit: gp(48, 2.38),  baseUnit: 2.38,   enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 49,  category: 'insulation',     name: 'R20 Insulation',             qty: 864,  unit: gp(49, 0.75),  baseUnit: 0.75,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 50,  category: 'insulation',     name: 'R50 Blow-In Insulation',     qty: 2000, unit: gp(50, 1.50),  baseUnit: 1.50,   enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 51,  category: 'drywall',        name: '1/2" Drywall',               qty: 2000, unit: gp(51, 0.85),  baseUnit: 0.85,   enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 52,  category: 'drywall',        name: 'Fireguard',                  qty: 288,  unit: gp(52, 1.20),  baseUnit: 1.20,   enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 53,  category: 'interior_doors', name: 'Interior Doors',             qty: 0,    unit: gp(53, 250.00),baseUnit: 250.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 54,  category: 'interior_doors', name: 'Interior Door Knobs',        qty: 0,    unit: gp(54, 35.00), baseUnit: 35.00,  enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 55,  category: 'mechanical',     name: '3/4 HP Openers',             qty: 0,    unit: gp(55, 450.00),baseUnit: 450.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 56,  category: 'mechanical',     name: 'Attic Hatch',                qty: 1,    unit: gp(56, 220.00),baseUnit: 220.00, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 57,  category: 'kokiak',         name: 'Kokiak Panel Walls',         qty: 2880, unit: gp(57, 2.50),  baseUnit: 2.50,   enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 58,  category: 'kokiak',         name: 'Kokiak Panel Ceiling',       qty: 2000, unit: gp(58, 2.50),  baseUnit: 2.50,   enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 59,  category: 'kokiak',         name: 'Kokiak J Trim',              qty: 10,   unit: gp(59, 12.00), baseUnit: 12.00,  enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 60,  category: 'kokiak',         name: 'Multi Corner',               qty: 16,   unit: gp(60, 30.00), baseUnit: 30.00,  enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 61,  category: 'trades',         name: 'Permits',                    qty: 1,    unit: gp(61, 500.00),  baseUnit: 500.00,  enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 62,  category: 'trades',         name: 'Engineering',                qty: 1,    unit: gp(62, 1500.00), baseUnit: 1500.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 63,  category: 'trades',         name: 'Drafting',                   qty: 1,    unit: gp(63, 250.00),  baseUnit: 250.00,  enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 64,  category: 'trades',         name: 'Electrical',                 qty: 1,    unit: gp(64, 5000.00), baseUnit: 5000.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 65,  category: 'trades',         name: 'Plumbing',                   qty: 1,    unit: gp(65, 3000.00), baseUnit: 3000.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 66,  category: 'trades',         name: 'Water Hookup',               qty: 1,    unit: gp(66, 2000.00), baseUnit: 2000.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 67,  category: 'trades',         name: 'Septic Tank',                qty: 1,    unit: gp(67, 8000.00), baseUnit: 8000.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 68,  category: 'trades',         name: 'Gravel',                     qty: 1,    unit: gp(68, 1500.00), baseUnit: 1500.00, enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 69,  category: 'trades',         name: 'Concrete Floor',             qty: 1,    unit: gp(69, 3.50),    baseUnit: 3.50,    enabled: false, hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 70,  category: 'trades',         name: 'Door Paint',                 qty: 1,    unit: gp(70, 300.00),  baseUnit: 300.00,  enabled: false, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 71,  category: 'trades',         name: 'Tool Expenses',              qty: 1,    unit: gp(71, 2000.00), baseUnit: 2000.00, enabled: true,  hasFormula: true,  manualOverride: false, manualPriceOverride: false },
      { id: 72,  category: 'trades',         name: 'Trusses Package',            qty: 1,    unit: gp(72, 8000.00), baseUnit: 8000.00, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 73,  category: 'trades',         name: 'Bifold Door',                qty: 1,    unit: gp(73, 12000.00),baseUnit: 1200.00, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false, hasSizing: true, sizes: [{width:0,height:0,qty:1}], totalPerimeter: 0 },
      { id: 74,  category: 'trades',         name: 'Overhead Door',              qty: 0,    unit: gp(74, 2500.00), baseUnit: 2500.00, enabled: true,  hasFormula: false, manualOverride: false, manualPriceOverride: false, hasSizing: true, sizes: [{width:0,height:0,qty:1}], totalPerimeter: 0 }
    ]);
  }, []);

  // Update stud prices when studSize changes
  useEffect(() => {
    if (items.length === 0) return;
    const cp = studPrices[studSize];
    setItems(prev => prev.map(item => {
      if (item.id === 1) return { ...item, unit: cp.studs, baseUnit: cp.studs, name: `${studSize} Studs 16'` };
      if (item.id === 2) return { ...item, unit: cp.topPlates, baseUnit: cp.topPlates };
      if (item.id === 3) return { ...item, unit: cp.extraTopPlates, baseUnit: cp.extraTopPlates };
      if (item.id === 4) return { ...item, unit: cp.bottomPlates, baseUnit: cp.bottomPlates };
      return item;
    }));
  }, [studSize]);

  // Recalculate post unit price and sub-item prices when postSize or postDiameter changes
  useEffect(() => {
    if (items.length === 0) return;
    setItems(prev => {
      // First update sub-item base prices for the new diameter
      const updated = prev.map(item => {
        if (item.isPostSub && item.subKey) {
          const newPrice = subItemBasePrices[item.subKey][postDiameter] || 0;
          return { ...item, unit: newPrice, baseUnit: newPrice };
        }
        return item;
      });
      // Then recalculate post unit price
      const newPostUnit = calcPostUnitPrice(updated, dimensions.height || 16, postSize, postDiameter);
      return updated.map(item => {
        if (item.id === 101) {
          const newBase = calcPostBasePrice(dimensions.height || 16, postSize);
          return { ...item, name: `Post (${postSize})`, unit: newPostUnit, baseUnit: newBase };
        }
        return item;
      });
    });
  }, [postSize, postDiameter]);

  // Recalculate formula quantities on dimension/config changes
  useEffect(() => {
    setItems(prev => {
      const getTotalOpeningsPerimeter = () =>
        prev.filter(i => i.hasSizing && i.enabled).reduce((s, i) => s + (i.totalPerimeter || 0), 0);
      // Recalculate post price when height changes
      const newPostUnit = calcPostUnitPrice(prev, dimensions.height || 16, postSize, postDiameter);
      const newPostBase = calcPostBasePrice(dimensions.height || 16, postSize);
      return prev.map(item => {
        // Item 101 (Post): update both unit price AND qty via formula
        if (item.id === 101) {
          const newQty = item.manualOverride ? item.qty : Math.ceil((perimeter * 12) / config.studSpacing);
          return { ...item, unit: newPostUnit, baseUnit: newPostBase, qty: newQty };
        }
        if (item.hasFormula && !item.manualOverride) {
          if (item.id === 5)  return { ...item, qty: Math.ceil(getTotalOpeningsPerimeter() / 16) };
          if (item.id === 14) return { ...item, qty: Math.ceil(wallArea + roofArea + gableArea) };
          if (item.id === 15) return { ...item, qty: Math.ceil((wallArea + roofArea + gableArea) * 0.9) };
          if (formulas[item.id]) return { ...item, qty: formulas[item.id]() };
        }
        return item;
      });
    });
  }, [dimensions, config.studSpacing]);

  const updateQty = (id, val) =>
    setItems(items.map(item => item.id === id ? { ...item, qty: Math.max(0, Number(val)), manualOverride: true } : item));

  const updateItemSizes = (id, newSizes) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        let totalPerimeter = 0, totalQty = 0;
        const isWin = item.name.toLowerCase().includes('window');
        newSizes.forEach(s => {
          const w = Number(s.width)||0, h = Number(s.height)||0, q = Number(s.qty)||1;
          totalPerimeter += (isWin ? 2*(w+h) : w+2*h) * q;
          totalQty += q;
        });
        return { ...item, sizes: newSizes, totalPerimeter, qty: totalQty };
      });
      const getTop = (list) => list.filter(i => i.hasSizing && i.enabled).reduce((s, i) => s+(i.totalPerimeter||0), 0);
      return updated.map(item => {
        if (item.hasFormula && !item.manualOverride) {
          if (item.id === 5)  return { ...item, qty: Math.ceil(getTop(updated)/16) };
          if (item.id === 14) return { ...item, qty: Math.ceil(wallArea+roofArea+gableArea) };
          if (item.id === 15) return { ...item, qty: Math.ceil((wallArea+roofArea+gableArea)*0.9) };
        }
        return item;
      });
    });
  };

  const updateUnit = (id, val) =>
    setItems(items.map(item => item.id === id
      ? { ...item, unit: Math.max(0, Number(val)), manualPriceOverride: Number(val) !== (defaultPrices[id] !== undefined ? defaultPrices[id] : item.baseUnit) }
      : item));

  const lockPriceUpdate = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const ndp = { ...defaultPrices, [id]: item.unit };
    setDefaultPrices(ndp);
    localStorage.setItem('timbilt_default_prices', JSON.stringify(ndp));
    setItems(items.map(i => i.id === id ? { ...i, manualPriceOverride: false } : i));
  };

  const toggleItem = (id) => {
    setItems(prev => {
      const toggled = prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item);
      // If a post sub-item was toggled, recalculate the post unit price
      if ([102, 103, 104, 105].includes(id)) {
        const newPostUnit = calcPostUnitPrice(toggled, dimensions.height || 16, postSize, postDiameter);
        const newBase = calcPostBasePrice(dimensions.height || 16, postSize);
        return toggled.map(item => item.id === 101
          ? { ...item, unit: newPostUnit, baseUnit: newBase }
          : item);
      }
      return toggled;
    });
  };
  const removeItem = (id) => setItems(items.filter(item => item.id !== id));

  const addItem = () => {
    if (newItem.name && newItem.qty > 0 && newItem.unit > 0) {
      setItems([...items, {
        id: Math.max(...items.map(i => i.id)) + 1,
        ...newItem, qty: Number(newItem.qty), unit: Number(newItem.unit), baseUnit: Number(newItem.unit),
        enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false
      }]);
      setNewItem({ name: '', qty: 0, unit: 0, category: 'framing_lumber' });
      setShowAddForm(false);
    }
  };

  const updateDimension = (field, value) => {
    const nv = value === '' ? '' : Math.max(0, Number(value));
    setDimensions(prev => ({ ...prev, [field]: nv }));
  };

  // Filter items for display — hide post-frame items in stud mode, hide stud item in post mode
  const visibleItems = (list) => list.filter(item => {
    if (item.postFrameOnly) return frameType === 'post';
    if (item.id === 1) return frameType === 'stud';
    return true;
  });

  const materialTotal = visibleItems(items).filter(i => i.enabled && i.category !== 'trades').reduce((s,i) => s + i.qty*i.unit, 0);
  const tradesTotal   = visibleItems(items).filter(i => i.enabled && i.category === 'trades').reduce((s,i) => s + i.qty*i.unit, 0);
  const tradesWithFee = tradesTotal * 1.10;
  const pst   = materialTotal * config.pst;
  const waste = materialTotal * config.waste;
  const profit= materialTotal * config.profit;
  const buildingWithoutLabor = materialTotal + tradesWithFee + pst + waste + profit;
  const labor = floorArea * config.laborPerSqft;
  const totalQuoted = buildingWithoutLabor + labor;
  const gst   = totalQuoted * config.gst;
  const finalPrice = totalQuoted + gst;

  const categories = {
    framing_lumber: '📐 Framing Lumber',
    fasteners: '🔩 Fasteners & Anchoring',
    windows_doors: '🚪 Windows & Doors (Exterior)',
    exterior_metal: '🏠 Exterior Metal – Roofing & Walls',
    exterior_trim: '🎨 Exterior Trim & Door Components',
    interior_metal: '⬜ Interior Metal Panels & Trim',
    insulation: '🧊 Insulation & Air / Vapor Control',
    drywall: '📋 Drywall & Fire Protection',
    interior_doors: '🚪 Interior Doors & Hardware',
    mechanical: '⚙️ Mechanical / Electrical Accessories',
    kokiak: '🏗️ Kokiak Panel System',
    trades: '💼 Trades & Quoted Items'
  };

  const SizeModal = ({ item, onClose, onSave }) => {
    const [tempSizes, setTempSizes] = useState(item.sizes || [{width:0,height:0,qty:1}]);
    const addSize = () => setTempSizes([...tempSizes, {width:0,height:0,qty:1}]);
    const removeSize = (i) => setTempSizes(tempSizes.filter((_,idx) => idx !== i));
    const updateSize = (i, f, v) => {
      const ns = [...tempSizes];
      ns[i][f] = v==='' ? '' : Math.max(f==='qty'?1:0, isNaN(Number(v)) ? (f==='qty'?1:0) : Number(v));
      setTempSizes(ns);
    };
    const handleSave = () => {
      onSave(tempSizes.map(s => ({ width: s.width||0, height: s.height||0, qty: s.qty||1 })));
      onClose();
    };
    const isWin = item.name.toLowerCase().includes('window');
    const totalQty = tempSizes.reduce((s,sz) => s+(Number(sz.qty)||1), 0);
    const totalPerim = tempSizes.reduce((s,sz) => {
      const w=Number(sz.width)||0, h=Number(sz.height)||0, q=Number(sz.qty)||1;
      return s + (isWin ? 2*(w+h) : w+2*h)*q;
    }, 0);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{item.name} - Size Configuration</h3>
            <p className="text-sm text-slate-600 mb-4">{isWin ? 'Perimeter = 2×(W+H)' : 'Perimeter = W+2×H (3 sides)'}</p>
            <div className="space-y-3 mb-6">
              {tempSizes.map((sz, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 w-12">#{idx+1}</span>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Width (ft)</label><input type="number" step="0.1" value={sz.width} onChange={e=>updateSize(idx,'width',e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-black" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Height (ft)</label><input type="number" step="0.1" value={sz.height} onChange={e=>updateSize(idx,'height',e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-black" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label><input type="number" min="1" value={sz.qty||1} onChange={e=>updateSize(idx,'qty',e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-black" /></div>
                  </div>
                  <button onClick={()=>removeSize(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <button onClick={addSize} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 mb-6 w-full justify-center"><Plus className="w-4 h-4"/>Add Another Size</button>
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-sm text-indigo-700">Total Qty: {totalQty} | Total Perimeter: {totalPerim.toFixed(1)} ft</div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const saveProject = () => {
    if (!projectName) { alert('Please enter a project name'); return; }
    localStorage.setItem(`quote_${projectName}`, JSON.stringify({ projectName, dimensions, config, studSize, frameType, postSize, postDiameter, items }));
    alert('Project saved');
  };

  const loadProject = () => {
    if (!projectName) { alert('Enter a project name to load'); return; }
    const saved = localStorage.getItem(`quote_${projectName}`);
    if (!saved) { alert('Project not found'); return; }
    const data = JSON.parse(saved);
    setDimensions(data.dimensions); setConfig(data.config);
    setStudSize(data.studSize||'2x6'); setFrameType(data.frameType||'stud');
    setPostSize(data.postSize||'2x6 3ply'); setPostDiameter(data.postDiameter||'24"');
    setItems(data.items.map(item => ({
      ...item, baseUnit: item.baseUnit||item.unit, manualPriceOverride: false,
      sizes: item.sizes ? item.sizes.map(s=>({...s,qty:s.qty||1})) : (item.hasSizing?[{width:0,height:0,qty:1}]:undefined),
      totalPerimeter: item.totalPerimeter||0
    })));
  };

  const savedProjects = Object.keys(localStorage).filter(k=>k.startsWith('quote_')).map(k=>k.replace('quote_',''));

  const exportQuote = () => {
    const doc = new jsPDF({ unit:'pt', format:'letter' });
    const PW=doc.internal.pageSize.getWidth(), PH=doc.internal.pageSize.getHeight();
    const ML=28, MR=28, CW=PW-ML-MR;
    let y=0;
    const newPage=()=>{doc.addPage();y=28;};
    const checkY=(n)=>{if(y+n>PH-36)newPage();};
    const sf=(r,g,b)=>doc.setFillColor(r,g,b);
    const sd=(r,g,b)=>doc.setDrawColor(r,g,b);
    const st=(r,g,b)=>doc.setTextColor(r,g,b);
    const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const cc={
      framing_lumber:{header:[79,70,229],text:[255,255,255],alt:[238,242,255]},
      fasteners:{header:[124,58,237],text:[255,255,255],alt:[245,240,255]},
      windows_doors:{header:[37,99,235],text:[255,255,255],alt:[239,246,255]},
      exterior_metal:{header:[15,118,110],text:[255,255,255],alt:[240,253,250]},
      exterior_trim:{header:[180,83,9],text:[255,255,255],alt:[255,251,235]},
      interior_metal:{header:[55,65,81],text:[255,255,255],alt:[248,250,252]},
      insulation:{header:[3,105,161],text:[255,255,255],alt:[240,249,255]},
      drywall:{header:[100,116,139],text:[255,255,255],alt:[248,250,252]},
      interior_doors:{header:[21,128,61],text:[255,255,255],alt:[240,253,244]},
      mechanical:{header:[161,21,21],text:[255,255,255],alt:[254,242,242]},
      kokiak:{header:[51,65,85],text:[255,255,255],alt:[248,250,252]},
      trades:{header:[30,64,175],text:[255,255,255],alt:[239,246,255]}
    };
    sf(188,28,28);doc.rect(0,0,PW,72,'F');
    sf(129,0,0);doc.rect(0,68,PW,4,'F');
    st(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('TIMBILT CONSTRUCTION',ML,28);
    doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text('Building Quote',ML,44);
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(projectName||'Unnamed Project',PW-MR,28,{align:'right'});
    doc.setFont('helvetica','normal');doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'}),PW-MR,42,{align:'right'});
    y=84;
    checkY(80);
    sf(248,250,252);sd(203,213,225);doc.setLineWidth(0.5);doc.roundedRect(ML,y,CW,68,4,4,'FD');
    st(30,64,175);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('BUILDING SPECIFICATIONS',ML+10,y+14);
    const specs=[
      {label:'Dimensions',value:`${dimensions.width}' × ${dimensions.length}' × ${dimensions.height}'`},
      {label:'Frame Type',value:frameType==='post'?'Post Frame':'Stud Frame'},
      {label:frameType==='post'?'Post / Dia.':'Stud Size',value:frameType==='post'?`${postSize} / ⌀${postDiameter}`:studSize},
      {label:'Floor Area',value:`${floorArea.toLocaleString()} sqft`},
      {label:'Wall Area',value:`${Math.ceil(wallArea).toLocaleString()} sqft`},
      {label:'Roof Area',value:`${Math.ceil(roofArea).toLocaleString()} sqft`},
    ];
    const bW=CW/specs.length;
    specs.forEach((s,i)=>{
      const bx=ML+i*bW;
      st(71,85,105);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(s.label.toUpperCase(),bx+bW/2,y+32,{align:'center'});
      st(15,23,42);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(s.value,bx+bW/2,y+46,{align:'center'});
      if(i<specs.length-1){sd(203,213,225);doc.setLineWidth(0.3);doc.line(bx+bW,y+22,bx+bW,y+58);}
    });
    y+=78;checkY(56);
    const sc=[
      {label:'Materials',value:`$${fmt(materialTotal)}`,bg:[219,234,254],border:[147,197,253],txt:[29,78,216]},
      {label:'Building Cost',value:`$${fmt(buildingWithoutLabor)}`,bg:[220,252,231],border:[134,239,172],txt:[21,128,61]},
      {label:'Total Quoted',value:`$${fmt(totalQuoted)}`,bg:[243,232,255],border:[196,181,253],txt:[109,40,217]},
      {label:'Final (+ GST)',value:`$${fmt(finalPrice)}`,bg:[255,237,213],border:[253,186,116],txt:[154,52,18]},
    ];
    const cW=(CW-9)/4;
    sc.forEach((c,i)=>{
      const cx=ML+i*(cW+3);
      sf(...c.bg);sd(...c.border);doc.setLineWidth(0.5);doc.roundedRect(cx,y,cW,46,3,3,'FD');
      st(...c.txt);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(c.label.toUpperCase(),cx+cW/2,y+14,{align:'center'});
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(c.value,cx+cW/2,y+32,{align:'center'});
    });
    y+=58;sf(241,245,249);doc.rect(ML,y,CW,1,'F');y+=10;
    const COL={name:ML,qty:ML+CW*0.52,unit:ML+CW*0.68,total:ML+CW*0.84};
    const CW2={name:CW*0.50,qty:CW*0.14,unit:CW*0.14,total:CW*0.16};
    Object.entries(categories).forEach(([key,label])=>{
      const ci=visibleItems(items).filter(i=>i.category===key&&i.enabled);
      if(!ci.length)return;
      const ct=ci.reduce((s,i)=>s+i.qty*i.unit,0);
      const colors=cc[key]||cc.trades;
      const RH=16,HH=20;
      checkY(HH+RH);
      sf(...colors.header);doc.rect(ML,y,CW,HH,'F');
      st(...colors.text);doc.setFont('helvetica','bold');doc.setFontSize(8.5);
      doc.text(label.replace(/[\u{1F300}-\u{1FFFF}]/gu,'').replace(/[\u2600-\u27FF]/g,'').trim(),ML+8,y+13);
      doc.setFontSize(8);doc.text(`Subtotal: $${fmt(ct)}`,PW-MR-4,y+13,{align:'right'});
      y+=HH;checkY(14);
      sf(245,247,250);doc.rect(ML,y,CW,13,'F');
      st(100,116,139);doc.setFont('helvetica','normal');doc.setFontSize(6.5);
      doc.text('ITEM',COL.name+4,y+9);doc.text('QTY',COL.qty+CW2.qty/2,y+9,{align:'center'});
      doc.text('UNIT PRICE',COL.unit+CW2.unit/2,y+9,{align:'center'});doc.text('TOTAL',COL.total+CW2.total,y+9,{align:'right'});
      y+=13;
      ci.forEach((item,idx)=>{
        checkY(RH);
        if(idx%2===1){sf(...colors.alt);}else{sf(255,255,255);}
        doc.rect(ML,y,CW,RH,'F');
        sd(226,232,240);doc.setLineWidth(0.2);doc.line(ML,y+RH,ML+CW,y+RH);
        st(30,41,59);doc.setFont('helvetica','normal');doc.setFontSize(7.5);
        let nm=item.name; const mw=CW2.name-8;
        while(doc.getTextWidth(nm)>mw&&nm.length>10)nm=nm.slice(0,-2)+'...';
        doc.text(nm,COL.name+4,y+11);
        st(71,85,105);doc.text(item.qty.toLocaleString(),COL.qty+CW2.qty/2,y+11,{align:'center'});
        doc.text(`$${fmt(item.unit)}`,COL.unit+CW2.unit/2,y+11,{align:'center'});
        st(15,23,42);doc.setFont('helvetica','bold');doc.setFontSize(7.5);
        doc.text(`$${fmt(item.qty*item.unit)}`,COL.total+CW2.total,y+11,{align:'right'});
        y+=RH;
      });
      y+=6;
    });
    checkY(190);y+=8;
    sf(30,64,175);doc.rect(ML,y,CW,20,'F');
    st(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('QUOTE BREAKDOWN',ML+8,y+13);
    y+=20;sf(248,250,252);doc.rect(ML,y,CW,152,'F');
    const br=[
      {label:'Materials Total',value:`$${fmt(materialTotal)}`,bold:false},
      {label:'Trades & Quoted Items',value:`$${fmt(tradesTotal)}`,bold:false},
      {label:'Trades & Quoted Items Fee (10%)',value:`$${fmt(tradesWithFee-tradesTotal)}`,bold:false},
      {label:`PST (${(config.pst*100).toFixed(0)}%)`,value:`$${fmt(pst)}`,bold:false},
      {label:`Waste (${(config.waste*100).toFixed(0)}%)`,value:`$${fmt(waste)}`,bold:false},
      {label:`Profit (${(config.profit*100).toFixed(0)}%)`,value:`$${fmt(profit)}`,bold:false},
      null,
      {label:'Building Cost (no labor)',value:`$${fmt(buildingWithoutLabor)}`,bold:true},
      {label:`Labor (${floorArea.toLocaleString()} sqft × $${config.laborPerSqft}/sqft)`,value:`$${fmt(labor)}`,bold:false},
      null,
      {label:'Total Quoted',value:`$${fmt(totalQuoted)}`,bold:true},
      {label:`GST (${(config.gst*100).toFixed(0)}%)`,value:`$${fmt(gst)}`,bold:false},
    ];
    let by=y+12;
    br.forEach(row=>{
      if(!row){sd(203,213,225);doc.setLineWidth(0.4);doc.line(ML+8,by+2,ML+CW-8,by+2);by+=8;return;}
      st(row.bold?15:71,row.bold?23:85,row.bold?42:105);
      doc.setFont('helvetica',row.bold?'bold':'normal');doc.setFontSize(8);
      doc.text(row.label,ML+10,by);doc.text(row.value,ML+CW-10,by,{align:'right'});by+=11;
    });
    y+=152;checkY(52);y+=8;
    sf(30,64,175);doc.rect(ML,y,CW,44,'F');
    sf(99,132,255);doc.rect(ML,y,6,44,'F');
    st(219,234,254);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('FINAL PRICE (incl. GST)',ML+14,y+14);
    st(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text(`$${fmt(finalPrice)}`,ML+14,y+34);
    st(219,234,254);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text('All prices in CAD',PW-MR-4,y+34,{align:'right'});
    y+=52;
    for(let p=1;p<=doc.internal.getNumberOfPages();p++){
      doc.setPage(p);sf(241,245,249);doc.rect(0,PH-24,PW,24,'F');
      st(148,163,184);doc.setFont('helvetica','normal');doc.setFontSize(7);
      doc.text('Timbilt Construction — Quote generated by Timbilt Quote Editor',ML,PH-10);
      doc.text(`Page ${p} of ${doc.internal.getNumberOfPages()}`,PW-MR,PH-10,{align:'right'});
    }
    doc.save(`${(projectName||'quote').replace(/[^a-z0-9]/gi,'_').toLowerCase()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Timbilt Quote Editor</h1>
              <div className="flex gap-2">
                <button onClick={saveProject} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Project</button>
                <button onClick={loadProject} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Load Project</button>
              </div>
            </div>

            {/* Project Name + Frame Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
              <div className="relative w-full sm:w-96">
                <input type="text" list="saved-projects" value={projectName} onChange={e=>setProjectName(e.target.value)}
                  placeholder="Project name (e.g. Smith Shop 40x50)"
                  className="w-full px-4 py-2 text-black font-semibold border-2 border-slate-300 rounded-lg" />
                <datalist id="saved-projects">{savedProjects.map(n=><option key={n} value={n}/>)}</datalist>
                <div className="text-xs text-slate-500 mt-1">Type a new name or select an existing project</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
                <div className="flex rounded-lg border-2 border-slate-300 overflow-hidden">
                  <button onClick={()=>setFrameType('stud')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${frameType==='stud'?'bg-indigo-600 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>
                    🧱 Stud Frame
                  </button>
                  <button onClick={()=>setFrameType('post')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors border-l border-slate-300 ${frameType==='post'?'bg-amber-600 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>
                    🪵 Post Frame
                  </button>
                </div>
              </div>
            </div>

            {/* Dimensions Panel */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-lg border-2 border-indigo-200 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-indigo-900">🏗️ Building Dimensions</h2>
                {frameType==='post'&&<span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">Post Frame Mode</span>}
              </div>

              <div className="mb-4">
                {frameType==='stud' ? (
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-2">Stud Size</label>
                    <div className="flex gap-2">
                      <button onClick={()=>setStudSize('2x6')} className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${studSize==='2x6'?'bg-indigo-600 text-white':'bg-white text-indigo-600 border-2 border-indigo-300 hover:bg-indigo-50'}`}>2x6</button>
                      <button onClick={()=>setStudSize('2x8')} className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${studSize==='2x8'?'bg-indigo-600 text-white':'bg-white text-indigo-600 border-2 border-indigo-300 hover:bg-indigo-50'}`}>2x8</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-amber-700 mb-2">Post</label>
                      <select value={postSize} onChange={e=>setPostSize(e.target.value)} className="w-full px-4 py-2 text-black font-semibold border-2 border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500">
                        <option value="2x6 3ply">2x6 3ply</option>
                        <option value="2x6 4ply">2x6 4ply</option>
                        <option value="2x8 4ply">2x8 4ply</option>
                        <option value="2x8 5ply">2x8 5ply</option>
                        <option value="2x8 6ply">2x8 6ply</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-amber-700 mb-2">Diameter</label>
                      <select value={postDiameter} onChange={e=>setPostDiameter(e.target.value)} className="w-full px-4 py-2 text-black font-semibold border-2 border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500">
                        <option value='24"'>24"</option>
                        <option value='30"'>30"</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {['width','length','height'].map(f=>(
                  <div key={f}>
                    <label className="block text-sm font-medium text-indigo-700 mb-2">{f.charAt(0).toUpperCase()+f.slice(1)} (ft)</label>
                    <input type="number" value={dimensions[f]} onChange={e=>updateDimension(f,e.target.value)} className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">Stud Spacing (inches)</label>
                  <select value={config.studSpacing} onChange={e=>setConfig({...config,studSpacing:Number(e.target.value)})} className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value={12}>12"</option><option value={16}>16"</option><option value={24}>24"</option><option value={48}>48"</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">Roof Pitch (Rise/Run)</label>
                  <div className="flex gap-2 items-center">
                    <input type="number" value={config.roofPitchRise} onChange={e=>setConfig({...config,roofPitchRise:Math.max(0,Number(e.target.value)||0)})} className="w-20 px-3 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg"/>
                    <span className="text-indigo-900 font-semibold">/</span>
                    <input type="number" value={config.roofPitchRun} onChange={e=>setConfig({...config,roofPitchRun:Math.max(1,Number(e.target.value)||12)})} className="w-20 px-3 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">Overhang (inches)</label>
                  <input type="number" value={config.overhang} onChange={e=>setConfig({...config,overhang:Math.max(0,Number(e.target.value)||0)})} className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg"/>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-sm">
                {[
                  {label:'Floor Area',val:`${floorArea.toLocaleString()} sqft`},
                  {label:'Wall Area',val:`${Math.ceil(wallArea).toLocaleString()} sqft`},
                  {label:'Roof Area',val:`${Math.ceil(roofArea).toLocaleString()} sqft`},
                  {label:'Gable Area',val:`${Math.ceil(gableArea).toLocaleString()} sqft`},
                  {label:'Perimeter',val:`${perimeter.toLocaleString()} ft`},
                ].map(s=>(
                  <div key={s.label} className="bg-white/60 p-2 rounded">
                    <div className="text-indigo-600 font-medium text-xs sm:text-sm">{s.label}</div>
                    <div className="text-base sm:text-lg font-bold text-indigo-900">{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200"><div className="text-xs sm:text-sm text-blue-600 font-medium">Materials</div><div className="text-lg sm:text-2xl font-bold text-blue-900">${materialTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200"><div className="text-xs sm:text-sm text-green-600 font-medium">Building Cost</div><div className="text-lg sm:text-2xl font-bold text-green-900">${buildingWithoutLabor.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200"><div className="text-xs sm:text-sm text-purple-600 font-medium">Total Quoted</div><div className="text-lg sm:text-2xl font-bold text-purple-900">${totalQuoted.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200"><div className="text-xs sm:text-sm text-orange-600 font-medium">Final (+ GST)</div><div className="text-lg sm:text-2xl font-bold text-orange-900">${finalPrice.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
            </div>

            {/* Items by Category */}
            {Object.entries(categories).map(([categoryKey, categoryLabel]) => {
              const categoryItems = visibleItems(items).filter(item => item.category === categoryKey);
              if (!categoryItems.length) return null;
              const categoryTotal = categoryItems.filter(i=>i.enabled).reduce((s,i)=>s+i.qty*i.unit,0);
              return (
                <div key={categoryKey} className="mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-700">{categoryLabel}</h2>
                    <div className="text-xs sm:text-sm font-medium text-slate-600">Subtotal: ${categoryTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map(item => {
                      const isPostMain = item.id === 101;
                      const isPostSub  = POST_SUB_IDS.includes(item.id);
                      return (
                        <div key={item.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            isPostSub
                              ? `${item.enabled ? 'bg-amber-50 border-amber-200 hover:border-amber-300' : 'bg-amber-50/40 border-amber-100 opacity-50'} ml-6`
                              : item.enabled ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-50 border-slate-100 opacity-50'
                          }`}
                        >
                          {isPostSub && <span className="text-amber-400 text-xs flex-shrink-0 select-none">└</span>}
                          <input type="checkbox" checked={item.enabled} onChange={()=>toggleItem(item.id)} className="w-4 h-4 text-blue-600 rounded flex-shrink-0"/>
                          <div className="flex-1 font-medium text-slate-700 text-sm sm:text-base min-w-0">
                            <span>{item.name}</span>
                            {isPostMain && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-semibold">Post Frame</span>}
                            {isPostSub  && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-xs rounded">post frame</span>}
                            {item.manualOverride && <span className="ml-2 text-xs text-amber-600" title="Manually adjusted">✏️</span>}
                            {item.hasSizing && item.totalPerimeter > 0 && <div className="text-xs text-indigo-600 mt-1">Perimeter: {item.totalPerimeter.toFixed(1)} ft</div>}
                          </div>
                          {item.hasSizing && (
                            <button onClick={()=>setShowSizeModal(item.id)} className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 flex-shrink-0">📏 Size</button>
                          )}
                          {item.manualPriceOverride && (
                            <button onClick={()=>lockPriceUpdate(item.id)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0">Update Price</button>
                          )}
                          <input type="number" value={item.qty} onChange={e=>updateQty(item.id,e.target.value)}
                            disabled={!item.enabled || item.hasSizing}
                            className="w-20 sm:w-28 px-2 py-1 border border-slate-300 rounded text-center text-black text-sm disabled:bg-slate-100 flex-shrink-0"/>
                          <span className="text-slate-500 text-sm flex-shrink-0">×</span>
                          <span className="text-slate-500 text-sm flex-shrink-0">$</span>
                          <input type="number" step="0.01" value={item.unit} onChange={e=>updateUnit(item.id,e.target.value)}
                            disabled={!item.enabled}
                            className="w-20 sm:w-24 px-2 py-1 border border-slate-300 rounded text-right text-black text-sm disabled:bg-slate-100 flex-shrink-0"/>
                          <span className="text-slate-500 text-sm flex-shrink-0">=</span>
                          <div className="w-24 sm:w-28 text-right font-semibold text-slate-800 text-sm sm:text-base flex-shrink-0">
                            ${(item.qty*item.unit).toLocaleString('en-US',{minimumFractionDigits:2})}
                          </div>
                          <button onClick={()=>removeItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add Item */}
            {showAddForm ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3">Add New Item</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label><input type="text" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded" placeholder="e.g., Custom Trim"/></div>
                  <div className="w-full sm:w-32"><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label><input type="number" value={newItem.qty} onChange={e=>setNewItem({...newItem,qty:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded"/></div>
                  <div className="w-full sm:w-32"><label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label><input type="number" step="0.01" value={newItem.unit} onChange={e=>setNewItem({...newItem,unit:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded"/></div>
                  <div className="w-full sm:w-40"><label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded">
                      {Object.entries(categories).map(([k,l])=><option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addItem} className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
                    <button onClick={()=>setShowAddForm(false)} className="flex-1 sm:flex-initial px-4 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowAddForm(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 mb-6 w-full sm:w-auto"><Plus className="w-4 h-4"/>Add Custom Item</button>
            )}

            {/* Totals Breakdown */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200">
              <h3 className="text-base sm:text-lg text-black font-semibold mb-4">Quote Breakdown</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600"><span>Materials Total:</span><span className="font-semibold">${materialTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>Trades & Quoted Items:</span><span>${tradesTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>Trades & Quoted Items 10%:</span><span>${(tradesWithFee-tradesTotal).toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>PST (7%):</span><span>${pst.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>Waste (5%):</span><span>${waste.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>Profit (25%):</span><span>${profit.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between font-semibold text-slate-600"><span>Building Cost (no labor):</span><span>${buildingWithoutLabor.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>Labor ({floorArea} sqft × ${config.laborPerSqft}):</span><span className="font-semibold">${labor.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between font-bold text-lg text-slate-600"><span>Total Quoted:</span><span>${totalQuoted.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between text-slate-600"><span>GST (5%):</span><span>${gst.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl rounded-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="text-xs sm:text-sm font-medium opacity-90">Final Price (incl. GST)</div>
              <div className="text-2xl sm:text-4xl font-bold">${finalPrice.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
            </div>
            <button onClick={exportQuote} className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-semibold shadow-lg text-sm sm:text-base">
              <Download className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {showSizeModal && (
        <SizeModal
          item={items.find(i=>i.id===showSizeModal)}
          onClose={()=>setShowSizeModal(null)}
          onSave={sizes=>updateItemSizes(showSizeModal,sizes)}
        />
      )}
    </div>
  );
};

export default QuoteEditor;
