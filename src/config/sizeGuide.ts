// Size chart shown on every product page. These are SAMPLE measurements for a regular-fit tee/shirt:
// replace them with your real garment measurements (all in inches).
export const sizeGuide = {
  unit: 'inches',
  columns: ['Chest', 'Length', 'Shoulder'],
  rows: [
    { size: 'S', values: [38, 27, 17] },
    { size: 'M', values: [40, 28, 18] },
    { size: 'L', values: [42, 29, 19] },
    { size: 'XL', values: [44, 30, 20] },
    { size: 'XXL', values: [46, 31, 21] },
  ],
  tips: [
    'Chest: measure around the fullest part of your chest, under your arms.',
    'Length: measure from the highest point of the shoulder down to the hem.',
    'Between two sizes? Pick the bigger one for a relaxed fit.',
  ],
}
