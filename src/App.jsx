import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const QuoteEditor = () => {
  const [dimensions, setDimensions] = useState({ width: 0, length: 0, height: 16 });
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
    extraTopPlates: 4,
    roofPitchRise: 4,
    roofPitchRun: 12,
    overhang: 0
  });

  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', qty: 0, unit: 0, category: 'framing' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load global default prices from localStorage
  const loadDefaultPrices = () => {
    const saved = localStorage.getItem('timbilt_default_prices');
    return saved ? JSON.parse(saved) : {};
  };

  const [defaultPrices, setDefaultPrices] = useState(loadDefaultPrices());

  // Calculate derived values from dimensions
  const floorArea = (dimensions.width || 0) * (dimensions.length || 0);
  const perimeter = 2 * ((dimensions.width || 0) + (dimensions.length || 0));
  const wallAreaRect = perimeter * ((dimensions.height || 0) + 1);

  // Calculate gable roof geometry
  const roofPitch = config.roofPitchRise / config.roofPitchRun;
  const angleRad = Math.atan(roofPitch);
  const cosAngle = Math.cos(angleRad);
  const run = (dimensions.width || 0) / 2;
  const rise = run * roofPitch;
  const rafterLen = (run / cosAngle) + config.overhang;
  const roofArea = rafterLen * (dimensions.length || 0) * 2;
  const gableArea = (dimensions.width || 0) * rise * 2;
  const wallArea = wallAreaRect;

  // Formula definitions for each item
  const formulas = {
    1: () => Math.ceil((perimeter * 12) / config.studSpacing),
    2: () => Math.ceil(perimeter / 16) * config.topPlates,
    3: () => config.extraTopPlates,
    4: () => Math.ceil(perimeter / 16),
    5: () => Math.ceil(((dimensions.height || 0) + 1)/2 * (perimeter / 16)),
    6: () => Math.ceil(Math.ceil(rafterLen / 2) * (dimensions.length / 16) * 2* 1.7),
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
    const getPrice = (id, basePrice) => defaultPrices[id] !== undefined ? defaultPrices[id] : basePrice;
    
    const initialItems = [
      { id: 1, category: 'framing', name: '2x6 Studs 16\'', qty: 135, unit: getPrice(1, 18.19), baseUnit: 18.19, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 2, category: 'framing', name: 'Top Plates', qty: 27, unit: getPrice(2, 6.03), baseUnit: 6.03, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 3, category: 'framing', name: 'Extra Top Plates', qty: 14, unit: getPrice(3, 6.03), baseUnit: 6.03, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 4, category: 'framing', name: 'Bottom Plates (PWF)', qty: 11, unit: getPrice(4, 36.18), baseUnit: 36.18, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 5, category: 'framing', name: 'Wall Strapping', qty: 90, unit: getPrice(5, 9.88), baseUnit: 9.88, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 6, category: 'framing', name: 'Roof Strapping', qty: 122, unit: getPrice(6, 9.88), baseUnit: 9.88, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 7, category: 'framing', name: 'Headers (LF)', qty: 95, unit: getPrice(7, 7.10), baseUnit: 7.10, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 8, category: 'framing', name: 'Anchor Bolts', qty: 45, unit: getPrice(8, 2.23), baseUnit: 2.23, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 9, category: 'framing', name: 'Sill Gasket', qty: 2, unit: getPrice(9, 15.29), baseUnit: 15.29, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 10, category: 'framing', name: 'Paslode Nails 2⅜"', qty: 2, unit: getPrice(10, 6.73), baseUnit: 6.73, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 11, category: 'framing', name: 'Paslode Nails 3¼"', qty: 3, unit: getPrice(11, 75.50), baseUnit: 75.50, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 12, category: 'openings', name: 'Windows', qty: 2, unit: getPrice(12, 560.70), baseUnit: 560.70, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 13, category: 'openings', name: 'Steel Man Doors', qty: 1, unit: getPrice(13, 693.00), baseUnit: 693.00, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 14, category: 'openings', name: 'Door Handles', qty: 1, unit: getPrice(14, 89.99), baseUnit: 89.99, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 15, category: 'exterior', name: '28GA Roof Metal (sqft)', qty: 2199, unit: getPrice(15, 1.21), baseUnit: 1.21, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 16, category: 'exterior', name: '28GA Wall Metal (sqft)', qty: 3593, unit: getPrice(16, 1.21), baseUnit: 1.21, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 17, category: 'exterior', name: 'Ridge Caps', qty: 5, unit: getPrice(17, 28.86), baseUnit: 28.86, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 18, category: 'exterior', name: 'Inside Corners', qty: 24, unit: getPrice(18, 11.62), baseUnit: 11.62, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 19, category: 'exterior', name: 'Outside Corners', qty: 4, unit: getPrice(19, 24.42), baseUnit: 24.42, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 20, category: 'exterior', name: 'Gable Flashings', qty: 4, unit: getPrice(20, 35.97), baseUnit: 35.97, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 21, category: 'exterior', name: 'Drip Edges', qty: 3, unit: getPrice(21, 8.77), baseUnit: 8.77, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 22, category: 'exterior', name: 'Base Flashings', qty: 17, unit: getPrice(22, 9.38), baseUnit: 9.38, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 23, category: 'exterior', name: 'Door Jambs 11.25"', qty: 5, unit: getPrice(23, 35.07), baseUnit: 35.07, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 24, category: 'exterior', name: 'Flat Stock', qty: 17, unit: getPrice(24, 18.00), baseUnit: 18.00, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 25, category: 'exterior', name: 'Eave Flashings', qty: 14, unit: getPrice(25, 18.28), baseUnit: 18.28, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 26, category: 'exterior', name: 'J Channels', qty: 10, unit: getPrice(26, 9.66), baseUnit: 9.66, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 27, category: 'exterior', name: 'Ridge Flex-O-Vent', qty: 5, unit: getPrice(27, 21.64), baseUnit: 21.64, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 28, category: 'exterior', name: 'Foam Closures', qty: 32, unit: getPrice(28, 1.60), baseUnit: 1.60, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 29, category: 'exterior', name: 'Metal Screws (boxes)', qty: 6, unit: getPrice(29, 0.10), baseUnit: 0.10, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 30, category: 'interior', name: 'Interior Wall Metal (sqft)', qty: 2880, unit: getPrice(30, 1.17), baseUnit: 1.17, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 31, category: 'interior', name: 'Interior Ceiling Metal (sqft)', qty: 2000, unit: getPrice(31, 1.17), baseUnit: 1.17, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 32, category: 'interior', name: 'Interior J Channels', qty: 10, unit: getPrice(32, 9.66), baseUnit: 9.66, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 33, category: 'interior', name: 'Interior Corners', qty: 16, unit: getPrice(33, 27.07), baseUnit: 27.07, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 34, category: 'interior', name: 'Interior Screws (boxes)', qty: 5, unit: getPrice(34, 0.08), baseUnit: 0.08, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 35, category: 'interior', name: 'O/H Door Flatstock', qty: 2, unit: getPrice(35, 46.20), baseUnit: 46.20, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 36, category: 'interior', name: 'Header Trim', qty: 2, unit: getPrice(36, 33.39), baseUnit: 33.39, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 37, category: 'interior', name: 'Window/Door Trims 4x8', qty: 1, unit: getPrice(37, 112.12), baseUnit: 112.12, enabled: true, hasFormula: false, manualOverride: false, manualPriceOverride: false },
      { id: 38, category: 'insulation', name: 'House Wrap (rolls)', qty: 4, unit: getPrice(38, 111.71), baseUnit: 111.71, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 39, category: 'insulation', name: 'Poly Vapor Barrier (rolls)', qty: 3, unit: getPrice(39, 123.19), baseUnit: 123.19, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 40, category: 'insulation', name: 'Staples (packages)', qty: 4, unit: getPrice(40, 11.87), baseUnit: 11.87, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 41, category: 'insulation', name: 'Tuck Tape (rolls)', qty: 2, unit: getPrice(41, 13.15), baseUnit: 13.15, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 42, category: 'insulation', name: 'Acu Seal (tubes)', qty: 6, unit: getPrice(42, 14.09), baseUnit: 14.09, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 43, category: 'insulation', name: 'R20 Wall Insulation (sqft)', qty: 2880, unit: getPrice(43, 0.65), baseUnit: 0.65, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 44, category: 'insulation', name: 'R50 Ceiling Insulation (sqft)', qty: 2000, unit: getPrice(44, 1.50), baseUnit: 1.50, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false },
      { id: 45, category: 'insulation', name: 'Attic Hatch', qty: 1, unit: getPrice(45, 220.00), baseUnit: 220.00, enabled: true, hasFormula: true, manualOverride: false, manualPriceOverride: false }
    ];
    setItems(initialItems);
  }, [defaultPrices]);

  // Recalculate quantities when dimensions change (only for items without manual override)
  useEffect(() => {
    setItems(prevItems => prevItems.map(item => {
      if (item.hasFormula && formulas[item.id] && !item.manualOverride) {
        return { ...item, qty: formulas[item.id]() };
      }
      return item;
    }));
  }, [dimensions, config.studSpacing]);

  const updateQty = (id, newQty) => {
    setItems(items.map(item => 
      item.id === id ? { 
        ...item, 
        qty: Math.max(0, Number(newQty)),
        manualOverride: true // Mark as manually overridden
      } : item
    ));
  };

  const updateUnit = (id, newUnit) => {
    setItems(items.map(item => 
      item.id === id ? { 
        ...item, 
        unit: Math.max(0, Number(newUnit)),
        manualPriceOverride: Number(newUnit) !== (defaultPrices[id] !== undefined ? defaultPrices[id] : item.baseUnit)
      } : item
    ));
  };

  const lockPriceUpdate = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Update global default prices
    const newDefaultPrices = {
      ...defaultPrices,
      [id]: item.unit
    };
    setDefaultPrices(newDefaultPrices);
    localStorage.setItem('timbilt_default_prices', JSON.stringify(newDefaultPrices));
    
    // Remove the manual override flag
    setItems(items.map(i => 
      i.id === id ? { ...i, manualPriceOverride: false } : i
    ));
    
    console.log('Updated global default price for item:', item.name, 'New price:', item.unit);
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
        baseUnit: Number(newItem.unit),
        enabled: true,
        hasFormula: false,
        manualOverride: false,
        manualPriceOverride: false
      }]);
      setNewItem({ name: '', qty: 0, unit: 0, category: 'framing' });
      setShowAddForm(false);
    }
  };

  const updateDimension = (field, value) => {
    const numValue = value === '' ? '' : Math.max(0, Number(value));
    setDimensions(prev => ({ ...prev, [field]: numValue }));
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

  // Save project with manual overrides
  const saveProject = () => {
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    const projectData = {
      projectName,
      dimensions,
      config,
      items // This now includes manualOverride flags and defaultUnit
    };
    console.log('Saving project:', projectName);
    console.log('Items being saved:', items.map(i => ({ id: i.id, name: i.name, unit: i.unit, defaultUnit: i.defaultUnit })));
    localStorage.setItem(`quote_${projectName}`, JSON.stringify(projectData));
    alert('Project saved');
  };

  // Load Project
  const loadProject = () => {
    if (!projectName) {
      alert('Enter a project name to load');
      return;
    }
    const saved = localStorage.getItem(`quote_${projectName}`);
    if (!saved) {
      alert('Project not found');
      return;
    }
    const data = JSON.parse(saved);
    console.log('Loading project:', projectName);
    setDimensions(data.dimensions);
    setConfig(data.config);
    // Load items as-is from the saved project
    setItems(data.items.map(item => ({
      ...item,
      baseUnit: item.baseUnit || item.unit, // backward compatibility
      manualPriceOverride: false // reset price override flag
    })));
  };

  // List Saved project
  const savedProjects = Object.keys(localStorage)
    .filter(key => key.startsWith('quote_'))
    .map(key => key.replace('quote_', ''));

  // Export Quote
  const exportQuote = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Project: ${projectName || 'Unnamed Project'}`, margin, yPos);
    yPos += 8;

    // Building dimensions
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Building: ${dimensions.width}' × ${dimensions.length}' × ${dimensions.height}' | Roof: ${config.roofPitchRise}/${config.roofPitchRun}`, margin, yPos);
    yPos += 5;
    doc.text(`Floor: ${floorArea} sqft | Wall: ${Math.ceil(wallArea)} sqft | Roof: ${Math.ceil(roofArea)} sqft`, margin, yPos);
    yPos += 10;

    // Items by category
    Object.entries(categories).forEach(([key, label]) => {
      const catItems = items.filter(i => i.category === key && i.enabled);
      if (catItems.length === 0) return;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      catItems.forEach(item => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const itemText = `${item.name}`;
        const qtyText = `${item.qty} × $${item.unit.toFixed(2)}`;
        const totalText = `$${(item.qty * item.unit).toFixed(2)}`;

        doc.text(itemText, margin + 2, yPos);
        doc.text(qtyText, pageWidth - margin - 60, yPos);
        doc.text(totalText, pageWidth - margin - 30, yPos, { align: 'right' });
        yPos += 5;
      });

      yPos += 3;
    });

    // Totals section
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(10);

    const totals = [
      ['Materials Total:', `$${materialTotal.toFixed(2)}`],
      ['Other Items:', `$${otherItems.toFixed(2)}`],
      ['Management (7%):', `$${management.toFixed(2)}`],
      ['PST (7%):', `$${pst.toFixed(2)}`],
      ['Waste (5%):', `$${waste.toFixed(2)}`],
      ['Profit (25%):', `$${profit.toFixed(2)}`],
      ['', ''],
      ['Building Cost (no labor):', `$${buildingWithoutLabor.toFixed(2)}`],
      ['Labor:', `$${labor.toFixed(2)}`],
      ['', ''],
      ['TOTAL QUOTED:', `$${totalQuoted.toFixed(2)}`],
      ['GST (5%):', `$${gst.toFixed(2)}`],
      ['', '']
    ];

    totals.forEach(([label, value]) => {
      if (label === '') {
        yPos += 2;
        return;
      }
      doc.text(label, margin, yPos);
      doc.text(value, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    });

    // Final price
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('FINAL PRICE:', margin, yPos);
    doc.text(`$${finalPrice.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    const safeProjectName = projectName ? projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'quote';
    doc.save(`${safeProjectName}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Timbilt Quote Editor</h1>
              <div className="flex gap-2">
                <button
                  onClick={saveProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Project
                </button>
                <button
                  onClick={loadProject}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Load Project
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-96 mb-6">
              <input
                type="text"
                list="saved-projects"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name (e.g. Smith Shop 40x50)"
                className="w-full px-4 py-2 text-black font-semibold border-2 border-slate-300 rounded-lg"
              />
              <datalist id="saved-projects">
                {savedProjects.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="text-xs text-slate-500 mt-1">
                Type a new name or select an existing project
              </div>
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
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          item.enabled 
                            ? 'bg-white border-slate-200 hover:border-slate-300' 
                            : 'bg-slate-50 border-slate-100 opacity-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                        />
                        <div className="flex-1 font-medium text-slate-700 text-sm sm:text-base min-w-0">
                          {item.name}
                          {item.manualOverride && (
                            <span className="ml-2 text-xs text-amber-600" title="Manually adjusted quantity">✏️</span>
                          )}
                        </div>
                        {item.manualPriceOverride && (
                          <button
                            onClick={() => lockPriceUpdate(item.id)}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0 whitespace-nowrap"
                            title="Lock this price as the new default"
                          >
                            Update Price
                          </button>
                        )}
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateQty(item.id, e.target.value)}
                          disabled={!item.enabled}
                          className="w-20 sm:w-28 px-2 py-1 border border-slate-300 rounded text-center text-black text-sm disabled:bg-slate-100 flex-shrink-0"
                        />
                        <span className="text-slate-500 text-sm flex-shrink-0">×</span>
                        <span className="text-slate-500 text-sm flex-shrink-0">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit}
                          onChange={(e) => updateUnit(item.id, e.target.value)}
                          disabled={!item.enabled}
                          className="w-20 sm:w-24 px-2 py-1 border border-slate-300 rounded text-right text-black text-sm disabled:bg-slate-100 flex-shrink-0"
                        />
                        <span className="text-slate-500 text-sm flex-shrink-0">=</span>
                        <div className="w-24 sm:w-28 text-right font-semibold text-slate-800 text-sm sm:text-base flex-shrink-0">
                          ${(item.qty * item.unit).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer with Final Price */}
      <div className="fixed bottom-0 left-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl rounded-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="text-xs sm:text-sm font-medium opacity-90">Final Price (incl. GST)</div>
              <div className="text-2xl sm:text-4xl font-bold">
                ${finalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </div>
            </div>
            <button
              onClick={exportQuote}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditor;
