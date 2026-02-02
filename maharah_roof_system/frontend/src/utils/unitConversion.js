// Unit conversion system for recipe calculations
// Converts quantity from one unit to another

const UNIT_CONVERSIONS = {
  // Weight conversions (base unit: جرام)
  'جرام': 1,
  'كيلو': 1000,
  'طن': 1000000,

  // Volume conversions (base unit: ملليلتر)
  'ملليلتر': 1,
  'لتر': 1000,
  'جالون': 3785.41,

  // Cooking measurements to grams (approximate)
  'كوب': 240,           // ~240ml or ~120g depending on ingredient
  'ملعقة كبيرة': 15,    // ~15ml or ~15g
  'ملعقة صغيرة': 5,     // ~5ml or ~5g
  'رشة': 0.5,

  // Count-based units (no conversion)
  'قطعة': 1,
  'علبة': 1,
  'كرتونة': 1,
  'عبوة': 1,
  'كيس': 1,
  'زجاجة': 1,
};

// Get the category of a unit (weight, volume, count, etc.)
const getUnitCategory = (unit) => {
  const weightUnits = ['جرام', 'كيلو', 'طن'];
  const volumeUnits = ['ملليلتر', 'لتر', 'جالون'];
  const cookingUnits = ['كوب', 'ملعقة كبيرة', 'ملعقة صغيرة', 'رشة'];
  const countUnits = ['قطعة', 'علبة', 'كرتونة', 'عبوة', 'كيس', 'زجاجة'];

  if (weightUnits.includes(unit)) return 'weight';
  if (volumeUnits.includes(unit)) return 'volume';
  if (cookingUnits.includes(unit)) return 'cooking';
  if (countUnits.includes(unit)) return 'count';
  return 'unknown';
};

// Convert quantity from one unit to another
export const convertUnits = (quantity, fromUnit, toUnit) => {
  // If same unit, no conversion needed
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Check if units are in the same category
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);

  // Can't convert between different categories
  if (fromCategory !== toCategory) {
    console.warn(`Cannot convert between ${fromUnit} and ${toUnit} - different categories`);
    return quantity; // Return as-is
  }

  // Count-based units don't convert
  if (fromCategory === 'count') {
    return quantity;
  }

  // Get conversion factors
  const fromFactor = UNIT_CONVERSIONS[fromUnit] || 1;
  const toFactor = UNIT_CONVERSIONS[toUnit] || 1;

  // Convert to base unit, then to target unit
  const baseQuantity = quantity * fromFactor;
  const convertedQuantity = baseQuantity / toFactor;

  return convertedQuantity;
};

// Get compatible units for a given unit (same category)
export const getCompatibleUnits = (unit) => {
  const category = getUnitCategory(unit);

  const unitsByCategory = {
    weight: ['جرام', 'كيلو', 'طن'],
    volume: ['ملليلتر', 'لتر', 'جالون'],
    cooking: ['كوب', 'ملعقة كبيرة', 'ملعقة صغيرة', 'رشة'],
    count: ['قطعة', 'علبة', 'كرتونة', 'عبوة', 'كيس', 'زجاجة'],
  };

  return unitsByCategory[category] || [unit];
};

export default {
  convertUnits,
  getCompatibleUnits,
  getUnitCategory,
};
