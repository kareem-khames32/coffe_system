// Standard units of measurement for raw materials
export const MEASUREMENT_UNITS = [
  // Weight units
  { value: 'كيلو', label: 'كيلو (kg)', category: 'وزن' },
  { value: 'جرام', label: 'جرام (g)', category: 'وزن' },
  { value: 'طن', label: 'طن (ton)', category: 'وزن' },

  // Volume units (liquids)
  { value: 'لتر', label: 'لتر (L)', category: 'حجم (سوائل)' },
  { value: 'ملليلتر', label: 'ملليلتر (ml)', category: 'حجم (سوائل)' },
  { value: 'جالون', label: 'جالون (gallon)', category: 'حجم (سوائل)' },

  // Counting units
  { value: 'قطعة', label: 'قطعة', category: 'عدد' },
  { value: 'علبة', label: 'علبة', category: 'عدد' },
  { value: 'كرتونة', label: 'كرتونة', category: 'عدد' },
  { value: 'عبوة', label: 'عبوة', category: 'عدد' },
  { value: 'كيس', label: 'كيس', category: 'عدد' },
  { value: 'زجاجة', label: 'زجاجة', category: 'عدد' },

  // Cooking measurements
  { value: 'كوب', label: 'كوب', category: 'طهي' },
  { value: 'ملعقة كبيرة', label: 'ملعقة كبيرة (tbsp)', category: 'طهي' },
  { value: 'ملعقة صغيرة', label: 'ملعقة صغيرة (tsp)', category: 'طهي' },
  { value: 'رشة', label: 'رشة', category: 'طهي' },
];

// Get units by category
export const getUnitsByCategory = () => {
  const grouped = {};
  MEASUREMENT_UNITS.forEach(unit => {
    if (!grouped[unit.category]) {
      grouped[unit.category] = [];
    }
    grouped[unit.category].push(unit);
  });
  return grouped;
};

// Get unit label by value
export const getUnitLabel = (value) => {
  const unit = MEASUREMENT_UNITS.find(u => u.value === value);
  return unit ? unit.label : value;
};

export default MEASUREMENT_UNITS;
