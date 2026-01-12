/**
 * Unit conversion utilities for inventory and recipe management
 */

const UNIT_CONVERSIONS = {
  // Weight conversions (base unit: جرام)
  'جرام': 1,
  'كيلو': 1000,
  'طن': 1000000,

  // Volume conversions (base unit: ملليلتر)
  'ملليلتر': 1,
  'لتر': 1000,
  'جالون': 3785.41,

  // Cooking measurements (approximate conversion to grams)
  'كوب': 240,
  'ملعقة كبيرة': 15,
  'ملعقة صغيرة': 5,
  'رشة': 0.5,

  // Count-based units (no conversion)
  'قطعة': 1,
  'علبة': 1,
  'كرتونة': 1,
  'عبوة': 1,
  'كيس': 1,
  'زجاجة': 1,
};

/**
 * Get the category of a unit (weight, volume, cooking, count)
 */
function getUnitCategory(unit) {
  const weightUnits = ['جرام', 'كيلو', 'طن'];
  const volumeUnits = ['ملليلتر', 'لتر', 'جالون'];
  const cookingUnits = ['كوب', 'ملعقة كبيرة', 'ملعقة صغيرة', 'رشة'];
  const countUnits = ['قطعة', 'علبة', 'كرتونة', 'عبوة', 'كيس', 'زجاجة'];

  if (weightUnits.includes(unit)) return 'weight';
  if (volumeUnits.includes(unit)) return 'volume';
  if (cookingUnits.includes(unit)) return 'cooking';
  if (countUnits.includes(unit)) return 'count';

  return 'unknown';
}

/**
 * Convert quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number} - The converted quantity
 */
function convertUnits(quantity, fromUnit, toUnit) {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Check if units are in the same category
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);

  if (fromCategory !== toCategory) {
    console.warn(`Cannot convert between ${fromUnit} (${fromCategory}) and ${toUnit} (${toCategory})`);
    return quantity; // Return original quantity if conversion not possible
  }

  // Count-based units cannot be converted
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
}

/**
 * Get compatible units for a given unit (same category)
 * @param {string} unit - The unit to find compatible units for
 * @returns {string[]} - Array of compatible units
 */
function getCompatibleUnits(unit) {
  const category = getUnitCategory(unit);

  const unitsByCategory = {
    weight: ['جرام', 'كيلو', 'طن'],
    volume: ['ملليلتر', 'لتر', 'جالون'],
    cooking: ['كوب', 'ملعقة كبيرة', 'ملعقة صغيرة', 'رشة'],
    count: ['قطعة', 'علبة', 'كرتونة', 'عبوة', 'كيس', 'زجاجة'],
  };

  return unitsByCategory[category] || [unit];
}

module.exports = {
  convertUnits,
  getCompatibleUnits,
  getUnitCategory,
  UNIT_CONVERSIONS
};
