import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download } from 'lucide-react';

const QuoteEditor = () => {
  const [dimensions, setDimensions] = useState({
    width: 40,
    length: 50,
    height: 16
  });

  const [config, setConfig] = useState({
    management: 0.07,
    pst: 0.07,
    waste: 0.05,
    profit: 0.25,
    gst: 0.05,
    laborPerSqft: 10,
    toolExpense: 2000,
    drafting: 250,
    studSpacing: 16,
    topPlates: 2,
    extraTopPlates: 1,
    roofPitch: 1/3,
    overhang: 4
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', qty: 0, unit: 0, category: 'framing' });
  const [showAddForm, setShowAddForm] = useState(false);

  const floorArea = dimensions.width * dimensions.length;
  const perimeter = 2 * (dimensions.width + dimensions.length);
  const wallArea = perimeter * dimensions.height;
  const angleRad = Math.atan(config.roofPitch);
  const cosAngle = Math.cos(angleRad);
  const run = dimensions.width / 2;
  const rafterLen = (run / cosAngle) + config.overhang;
  const roofArea = rafterLen * dimensions.length * 2;
  const gableArea = (dimensions.width / 2) * (dimensions.width / 2 * config.roofPitch) * 2;

  const formulas = {
    1: () => Math.ceil((perimeter * 12) / config.studSpacing),
    2: () => Math.ceil(perimeter / 16) * config.topPlates,
    3: () => Math.ceil(perimeter / 16) * config.extraTopPlates,
    4: () => Math.ceil(perimeter / 16),
    5: () => Math.ceil(Math.ceil(dimensions.height / 2) * (perimeter / 16)),
    6: () => Math.ceil(Math.ceil(rafterLen / 2) * (dimensions.length / 16) * 2),
    7: () => 95,
    8: () => Math.ceil(perimeter / 4),
    9: () => Math.ceil(perimeter / 50),
    10: () => Math.ceil((Math.ceil((perimeter * 12) / config.studSpacing) * 30) / 2000),
    11: () => Math.ceil((Math.ceil((perimeter * 12) / config.studSpacing) * 35) / 2000),
    15: () => Math.ceil(roofArea),
    16: () => Math.ceil(wallArea + gableArea),
    17: () => Math.ceil(dimensions.length / 10),
    18: () => Math.ceil((dimensions.length * 0.70) / 16) + 2,
    19: () => 4,
    20: () => 4,
    21: () => Math.ceil(perimeter / 10),
    22: () => Math.ceil(perimeter / 16),
    23: () => 5,
    24: () => Math.ceil(perimeter / 20),
    25: () => Math.ceil(perimeter / 10),
    26: () => Math.ceil(perimeter / 10),
    27: () => Math.ceil(dimensions.length / 10),
    28: () => Math.ceil((dimensions.length * 2) / 20),
    29: () => Math.ceil((Math.ceil(roofArea) + Math.ceil(wallArea + gableArea)) * 1.5 / 1000),
    30: () => Math.ceil(wallArea * 0.94),
    31: () => Math.ceil(floorArea),
    32: () => Math.ceil(perimeter / 10),
    33: () => Math.ceil(perimeter / 16),
    34: () => Math.ceil((Math.ceil(wallArea * 0.94) + Math.ceil(floorArea)) * 1.5 / 1000),
    38: () => Math.ceil(Math.ceil(wallArea * 0.94) / 1000),
    39: () => Math.ceil(Math.ceil(wallArea * 0.94) / 1000),
    40: () => 4,
    41: () => 2,
    42: () => 6,
    43: () => Math.ceil(wallArea * 0.94),
    44: () => Math.ceil(floorArea),
    45: () => 1
  };

  useEffect(() => {
    setItems([
      { id: 1, category: 'framing', name: '2x6 Studs 16\'', qty: 135, unit: 18.19, enabled: true, hasFormula: true },
      { id: 2, category: 'framing', name: 'Top Plates', qty: 27, unit: 6.03, enabled: true, hasFormula: true },
      { id: 3, category: 'framing', name: 'Extra Top Plates', qty: 14, unit: 6.03, enabled: true, hasFormula: true },
      { id: 4, category: 'framing', name: 'Bottom Plates (PWF)', qty: 11, unit: 36.18, enabled: true, hasFormula: true },
      { id: 5, category: 'framing', name: 'Wall Strapping', qty: 90, unit: 9.88, enabled: true, hasFormula: true },
      { id: 6, category: 'framing', name: 'Roof Strapping', qty: 122, unit: 9.88, enabled: true, hasFormula: true },
      { id: 7, category: 'framing', name: 'Headers (LF)', qty: 95, unit: 7.10, enabled: true, hasFormula: true },
      { id: 8, category: 'framing', name: 'Anchor Bolts', qty: 45, unit: 2.23, enabled: true, hasFormula: true },
      { id: 9, category: 'framing', name: 'Sill Gasket', qty: 2, unit: 15.29, enabled: true, hasFormula: true },
      { id: 10, category: 'framing', name: 'Paslode Nails 2⅜"', qty: 2, unit: 6.73, enabled: true, hasFormula: true },
      { id: 11, category: 'framing', name: 'Paslode Nails 3¼"', qty: 3, unit: 75.50, enabled: true, hasFormula: true },
      { id: 12, category: 'openings', name: 'Windows', qty: 2, unit: 560.70, enabled: true, hasFormula: false },
      { id: 13, category: 'openings', name: 'Steel Man Doors', qty: 1, unit: 693.00, enabled: true, hasFormula: false },
      { id: 14, category: 'openings', name: 'Door Handles', qty: 1, unit: 89.99, enabled: true, hasFormula: false },
      { id: 15, category: 'exterior', name: '28GA Roof Metal (sqft)', qty: 2199, unit: 1.21, enabled: true, hasFormula: true },
      { id: 16, category: 'exterior', name: '28GA Wall Metal (sqft)', qty: 3593, unit: 1.21, enabled: true, hasFormula: true },
      { id: 17, category: 'exterior', name: 'Ridge Caps', qty: 5, unit: 28.86, enabled: true, hasFormula: true },
      { id: 18, category: 'exterior', name: 'Inside Corners', qty: 24, unit: 11.62, enabled: true, hasFormula: true },
      { id: 19, category: 'exterior', name: 'Outside Corners', qty: 4, unit: 24.42, enabled: true, hasFormula: true },
      { id: 20, category: 'exterior', name: 'Gable Flashings', qty: 4, unit: 35.97, enabled: true, hasFormula: true },
      { id: 21, category: 'exterior', name: 'Drip Edges', qty: 3, unit: 8.77, enabled: true, hasFormula: true },
      { id: 22, category: 'exterior', name: 'Base Flashings', qty: 17, unit: 9.38, enabled: true, hasFormula: true },
      { id: 23, category: 'exterior', name: 'Door Jambs 11.25"', qty: 5, unit: 35.07, enabled: true, hasFormula: true },
      { id: 24, category: 'exterior', name: 'Flat Stock', qty: 17, unit: 18.00, enabled: true, hasFormula: true },
      { id: 25, category: 'exterior', name: 'Eave Flashings', qty: 14, unit: 18.28, enabled: true, hasFormula: true },
      { id: 26, category: 'exterior', name: 'J Channels', qty: 10, unit: 9.66, enabled: true, hasFormula: true },
      { id: 27, category: 'exterior', name: 'Ridge Flex-O-Vent', qty: 5, unit: 21.64, enabled: true, hasFormula: true },
      { id: 28, category: 'exterior', name: 'Foam Closures', qty: 32, unit: 1.60, enabled: true, hasFormula: true },
      { id: 29, category: 'exterior', name: 'Metal Screws (boxes)', qty: 6, unit: 0.10, enabled: true, hasFormula: true },
      { id: 30, category: 'interior', name: 'Interior Wall Metal (sqft)', qty: 2880, unit: 1.17, enabled: true, hasFormula: true },
      { id: 31, category: 'interior', name: 'Interior Ceiling Metal (sqft)', qty: 2000, unit: 1.17, enabled: true, hasFormula: true },
      { id: 32, category: 'interior', name: 'Interior J Channels', qty: 10, unit: 9.66, enabled: true, hasFormula: true },
      { id: 33, category: 'interior', name: 'Interior Corners', qty: 16, unit: 27.07, enabled: true, hasFormula: true },
      { id: 34, category: 'interior', name: 'Interior Screws (boxes)', qty: 5, unit: 0.08, enabled: true, hasFormula: true },
      { id: 35, category: 'interior', name: 'O/H Door Flatstock', qty: 2, unit: 46.20, enabled: true, hasFormula: false },
      { id: 36, category: 'interior', name: 'Header Trim', qty: 2, unit: 33.39, enabled: true, hasFormula: false },
      { id: 37, category: 'interior', name: 'Window/Door Trims 4x8', qty: 1, unit: 112.12, enabled: true, hasFormula: false },
      { id: 38, category: 'insulation', name: 'House Wrap (rolls)', qty: 4, unit: 111.71, enabled: true, hasFormula: true },
      { id: 39, category: 'insulation', name: 'Poly Vapor Barrier (rolls)', qty: 3, unit: 123.19, enabled: true, hasFormula: true },
      { id: 40, category: 'insulation', name: 'Staples (packages)', qty: 4, unit: 11.87, enabled: true, hasFormula: true },
      { id: 41, category: 'insulation', name: 'Tuck Tape (rolls)', qty: 2, unit: 13.15, enabled: true, hasFormula: true },
      { id: 42, category: 'insulation', name: 'Acu Seal (tubes)', qty: 6, unit: 14.09, enabled: true, hasFormula: true },
      { id: 43, category: 'insulation', name: 'R20 Wall Insulation (sqft)', qty: 2880, unit: 0.65, enabled: true, hasFormula: true },
      { id: 44, category: 'insulation', name: 'R50 Ceiling Insulation (sqft)', qty: 2000, unit: 1.50, enabled: true, hasFormula: true },
      { id: 45, category: 'insulation', name: 'Attic Hatch', qty: 1, unit: 220.00, enabled: true, hasFormula: true }
    ]);
  }, []);

  useEffect(() => {
    setItems(prev =>
      prev.map(item =>
        item.hasFormula && formulas[item.id]
          ? { ...item, qty: formulas[item.id]() }
          : item
      )
    );
  }, [dimensions, config.studSpacing]);

  const materialTotal = items.filter(i => i.enabled).reduce((s, i) => s + i.qty * i.unit, 0);
  const otherItems = config.toolExpense + config.drafting;
  const management = materialTotal * config.management;
  const pst = materialTotal * config.pst;
  const waste = materialTotal * config.waste;
  const profit = materialTotal * config.profit;
  const buildingWithoutLabor = materialTotal + otherItems + management + pst + waste + profit;
  const labor = floorArea * config.laborPerSqft;
  const totalQuoted = buildingWithoutLabor + labor;
  const gst = totalQuoted * config.gst;
  const finalPrice = totalQuoted + gst;

  const categories = {
    framing: '📐 Framing',
    openings: '🚪 Doors & Windows',
    exterior: '🏠 Exterior Metal & Trim',
    interior: '🎨 Interior Finishing',
    insulation: '🧊 Insulation & Wraps'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-24 sm:mb-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Interactive Quote Editor
            </h1>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
              <Download className="w-4 h-4" />
              Export Quote
            </button>
          </div>

          {/* Building Dimensions */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-lg border-2 border-indigo-200 mb-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-4">
              🏗️ Building Dimensions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['width','length','height'].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-indigo-700 mb-2 capitalize">
                    {f} (ft)
                  </label>
                  <input
                    type="number"
                    value={dimensions[f]}
                    onChange={e => setDimensions(p => ({...p,[f]:Number(e.target.value)||0}))}
                    className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="Floor Area" value={`${floorArea} sqft`} />
              <Stat label="Wall Area" value={`${Math.ceil(wallArea)} sqft`} />
              <Stat label="Roof Area" value={`${Math.ceil(roofArea)} sqft`} />
              <Stat label="Perimeter" value={`${perimeter} ft`} />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Summary label="Materials" value={materialTotal} color="blue" />
            <Summary label="Building Cost" value={buildingWithoutLabor} color="green" />
            <Summary label="Total Quoted" value={totalQuoted} color="purple" />
            <Summary label="Final (+ GST)" value={finalPrice} color="orange" />
          </div>

          {/* Items */}
          {Object.entries(categories).map(([key,label]) => {
            const list = items.filter(i => i.category === key);
            return (
              <div key={key} className="mb-6">
                <h2 className="text-xl font-semibold text-slate-700 mb-3">{label}</h2>
                <div className="space-y-2">
                  {list.map(item => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-white text-black"
                    >
                      <div className="flex-1 font-medium text-slate-700 text-sm sm:text-base">
                        {item.name}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input className="w-24 sm:w-20 px-3 py-2 border rounded text-right text-black" value={item.qty} />
                        <span>× $</span>
                        <input className="w-28 sm:w-24 px-3 py-2 border rounded text-right text-black" value={item.unit} />
                        <span>=</span>
                        <div className="w-22 sm:w-28 text-right font-semibold text-black">
                          ${(item.qty * item.unit).toFixed(2)}
                        </div>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t shadow-lg p-3 z-50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500">Final Price</div>
            <div className="text-lg font-bold text-blue-700">
              ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({label,value}) => (
  <div className="bg-white/60 p-2 rounded">
    <div className="text-indigo-600 font-medium">{label}</div>
    <div className="text-lg font-bold text-indigo-900">{value}</div>
  </div>
);

const Summary = ({label,value,color}) => (
  <div className={`bg-${color}-50 p-4 rounded-lg border`}>
    <div className={`text-sm text-${color}-600 font-medium`}>{label}</div>
    <div className={`text-2xl font-bold text-${color}-900`}>
      ${value.toLocaleString('en-US',{minimumFractionDigits:2})}
    </div>
  </div>
);

export default QuoteEditor;
