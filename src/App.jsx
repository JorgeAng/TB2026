import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download } from 'lucide-react';

const QuoteEditor = () => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    length: 0,
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
    roofPitchRise: 4,
    roofPitchRun: 12,
    overhang: 0
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', qty: 0, unit: 0, category: 'framing' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate derived values from dimensions
  const floorArea = (dimensions.width || 0) * (dimensions.length || 0);
  const perimeter = 2 * ((dimensions.width || 0) + (dimensions.length || 0));
  const wallAreaRect = perimeter * (dimensions.height +1|| 0);
  
  // Calculate gable roof geometry
  const roofPitch = config.roofPitchRise / config.roofPitchRun; // 4/12 = 0.333...
  const angleRad = Math.atan(roofPitch);
  const cosAngle = Math.cos(angleRad);
  const run = (dimensions.width || 0) / 2;
  const rise = run * roofPitch;
  const rafterLen = (run / cosAngle) + config.overhang;
  const roofArea = rafterLen * (dimensions.length || 0) * 2;
  
  // Gable area: 2 triangular ends (base * height / 2) * 2 ends, then multiply by 2
  const gableArea = (((dimensions.width || 0) * rise / 2) * 2) * 2;
  const wallArea = wallAreaRect;

  // Formula definitions for each item
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
    16: () => Math.ceil(wallAreaRect + gableArea),
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
    29: () => Math.ceil((Math.ceil(roofArea) + Math.ceil(wallAreaRect + gableArea)) * 1.5 / 1000),
    30: () => Math.ceil(wallAreaRect * 0.94),
    31: () => Math.ceil(floorArea),
    32: () => Math.ceil(perimeter / 10),
    33: () => Math.ceil(perimeter / 16),
    34: () => Math.ceil((Math.ceil(wallAreaRect * 0.94) + Math.ceil(floorArea)) * 1.5 / 1000),
    38: () => Math.ceil(Math.ceil(wallAreaRect * 0.94) / 1000),
    39: () => Math.ceil(Math.ceil(wallAreaRect * 0.94) / 1000),
    40: () => 4,
    41: () => 2,
    42: () => 6,
    43: () => Math.ceil(wallAreaRect * 0.94),
    44: () => Math.ceil(floorArea),
    45: () => 1
  };

  // Initialize items with formulas
  useEffect(() => {
    const initialItems = [
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
    ];
    setItems(initialItems);
  }, []);

  // Recalculate quantities when dimensions change
  useEffect(() => {
    setItems(prevItems => prevItems.map(item => {
      if (item.hasFormula && formulas[item.id]) {
        return { ...item, qty: formulas[item.id]() };
      }
      return item;
    }));
  }, [dimensions, config.studSpacing]);

  const updateQty = (id, newQty) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, qty: Math.max(0, Number(newQty)) } : item
    ));
  };

  const updateUnit = (id, newUnit) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, unit: Math.max(0, Number(newUnit)) } : item
    ));
  };

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItem.name && newItem.qty > 0 && newItem.unit > 0) {
      setItems([...items, { 
        id: Math.max(...items.map(i => i.id)) + 1, 
        ...newItem, 
        qty: Number(newItem.qty),
        unit: Number(newItem.unit),
        enabled: true,
        hasFormula: false
      }]);
      setNewItem({ name: '', qty: 0, unit: 0, category: 'framing' });
      setShowAddForm(false);
    }
  };

  const updateDimension = (field, value) => {
    const numValue = value === '' ? '' : Math.max(0, Number(value));
    setDimensions(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Calculate totals
  const materialTotal = items
    .filter(item => item.enabled)
    .reduce((sum, item) => sum + (item.qty * item.unit), 0);

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

  const exportQuote = () => {
    const text = `BUILDING QUOTE ESTIMATE\n\n` +
      Object.entries(categories).map(([key, label]) => {
        const catItems = items.filter(i => i.category === key && i.enabled);
        if (catItems.length === 0) return '';
        return `${label}\n` + catItems.map(i => 
          `  ${i.name}: ${i.qty} × $${i.unit.toFixed(2)} = $${(i.qty * i.unit).toFixed(2)}`
        ).join('\n');
      }).filter(Boolean).join('\n\n') +
      `\n\n` +
      `MATERIALS TOTAL: $${materialTotal.toFixed(2)}\n` +
      `Other Items: $${otherItems.toFixed(2)}\n` +
      `Management (7%): $${management.toFixed(2)}\n` +
      `PST (7%): $${pst.toFixed(2)}\n` +
      `Waste (5%): $${waste.toFixed(2)}\n` +
      `Profit (25%): $${profit.toFixed(2)}\n\n` +
      `Building Cost (no labor): $${buildingWithoutLabor.toFixed(2)}\n` +
      `Labor: $${labor.toFixed(2)}\n\n` +
      `TOTAL QUOTED: $${totalQuoted.toFixed(2)}\n` +
      `GST (5%): $${gst.toFixed(2)}\n` +
      `FINAL PRICE: $${finalPrice.toFixed(2)}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quote.txt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Interactive Quote Editor</h1>
            <button
              onClick={exportQuote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Export Quote
            </button>
          </div>

          {/* Building Dimensions */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-lg border-2 border-indigo-200 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-indigo-900 mb-4">🏗️ Building Dimensions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-2">Width (ft)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => updateDimension('width', e.target.value)}
                  className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-2">Length (ft)</label>
                <input
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => updateDimension('length', e.target.value)}
                  className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-2">Height (ft)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => updateDimension('height', e.target.value)}
                  className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-2">Roof Pitch (Rise/Run)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={config.roofPitchRise}
                    onChange={(e) => setConfig({...config, roofPitchRise: Math.max(0, Number(e.target.value) || 0)})}
                    className="w-20 px-3 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="4"
                  />
                  <span className="text-indigo-900 font-semibold">/</span>
                  <input
                    type="number"
                    value={config.roofPitchRun}
                    onChange={(e) => setConfig({...config, roofPitchRun: Math.max(1, Number(e.target.value) || 12)})}
                    className="w-20 px-3 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="12"
                  />
                  <span className="text-indigo-700 text-sm ml-2">(e.g., 4/12)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-2">Overhang (inches)</label>
                <input
                  type="number"
                  value={config.overhang}
                  onChange={(e) => setConfig({...config, overhang: Math.max(0, Number(e.target.value) || 0)})}
                  className="w-full px-4 py-2 text-black font-semibold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-sm">
              <div className="bg-white/60 p-2 rounded">
                <div className="text-indigo-600 font-medium text-xs sm:text-sm">Floor Area</div>
                <div className="text-base sm:text-lg font-bold text-indigo-900">{floorArea.toLocaleString()} sqft</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <div className="text-indigo-600 font-medium text-xs sm:text-sm">Wall Area</div>
                <div className="text-base sm:text-lg font-bold text-indigo-900">{Math.ceil(wallArea).toLocaleString()} sqft</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <div className="text-indigo-600 font-medium text-xs sm:text-sm">Roof Area</div>
                <div className="text-base sm:text-lg font-bold text-indigo-900">{Math.ceil(roofArea).toLocaleString()} sqft</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <div className="text-indigo-600 font-medium text-xs sm:text-sm">Gable Area</div>
                <div className="text-base sm:text-lg font-bold text-indigo-900">{Math.ceil(gableArea).toLocaleString()} sqft</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <div className="text-indigo-600 font-medium text-xs sm:text-sm">Perimeter</div>
                <div className="text-base sm:text-lg font-bold text-indigo-900">{perimeter.toLocaleString()} ft</div>
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Materials</div>
              <div className="text-lg sm:text-2xl font-bold text-blue-900">${materialTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <div className="text-xs sm:text-sm text-green-600 font-medium">Building Cost</div>
              <div className="text-lg sm:text-2xl font-bold text-green-900">${buildingWithoutLabor.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
              <div className="text-xs sm:text-sm text-purple-600 font-medium">Total Quoted</div>
              <div className="text-lg sm:text-2xl font-bold text-purple-900">${totalQuoted.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
              <div className="text-xs sm:text-sm text-orange-600 font-medium">Final (+ GST)</div>
              <div className="text-lg sm:text-2xl font-bold text-orange-900">${finalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          {/* Items by Category */}
          {Object.entries(categories).map(([categoryKey, categoryLabel]) => {
            const categoryItems = items.filter(item => item.category === categoryKey);
            const categoryTotal = categoryItems
              .filter(item => item.enabled)
              .reduce((sum, item) => sum + (item.qty * item.unit), 0);

            return (
              <div key={categoryKey} className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-700">{categoryLabel}</h2>
                  <div className="text-xs sm:text-sm font-medium text-slate-600">
                    Subtotal: ${categoryTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                </div>
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-all ${
                        item.enabled 
                          ? 'bg-white border-slate-200 hover:border-slate-300' 
                          : 'bg-slate-50 border-slate-100 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                        />
                        <div className="flex-1 font-medium text-slate-700 text-sm sm:text-base">{item.name}</div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto ml-6 sm:ml-0">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateQty(item.id, e.target.value)}
                          disabled={!item.enabled}
                          className="w-20 sm:w-28 px-2 py-1 border border-slate-300 rounded text-right text-black text-sm disabled:bg-slate-100"
                        />
                        <span className="text-slate-500 text-sm">×</span>
                        <span className="text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit}
                          onChange={(e) => updateUnit(item.id, e.target.value)}
                          disabled={!item.enabled}
                          className="w-20 sm:w-24 px-2 py-1 border border-slate-300 rounded text-right text-black text-sm disabled:bg-slate-100"
                        />
                        <span className="text-slate-500 text-sm">=</span>
                        <div className="w-24 sm:w-28 text-right font-semibold text-slate-800 text-sm sm:text-base">
                          ${(item.qty * item.unit).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add Item Form */}
          {showAddForm ? (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Add New Item</h3>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                    placeholder="e.g., Custom Trim"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({...newItem, qty: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addItem}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors mb-6 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Custom Item
            </button>
          )}

          {/* Totals Breakdown */}
          <div className="bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200">
            <h3 className="text-base sm:text-lg text-black font-semibold mb-4">Quote Breakdown</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Materials Total:</span>
                <span className="font-semibold">${materialTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Other Items (Tool Expense + Drafting):</span>
                <span className="font-semibold">${otherItems.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Management Fee (7%):</span>
                <span>${management.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PST (7%):</span>
                <span>${pst.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Waste (5%):</span>
                <span>${waste.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Profit (25%):</span>
                <span>${profit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between font-semibold text-slate-600">
                <span>Building Cost (no labor):</span>
                <span>${buildingWithoutLabor.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labor ({floorArea} sqft × ${config.laborPerSqft}):</span>
                <span className="font-semibold">${labor.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between font-bold text-lg text-slate-600">
                <span>Total Quoted:</span>
                <span>${totalQuoted.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>${gst.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="border-t-2 border-slate-400 pt-3 mt-3 flex justify-between font-bold text-lg sm:text-xl text-blue-700">
                <span>FINAL PRICE:</span>
                <span>${finalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditor;
