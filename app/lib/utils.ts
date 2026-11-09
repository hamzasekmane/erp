// Safely parse any value into a number
export const parseAmount = (val: unknown): number => {
  if (val === null || val === undefined || val === '' || val === 'NaN') return 0;

  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const cleaned = String(val)
    .replace(/\s|&nbsp;|\u00A0/g, '') // remove all spaces
    .replace(',', '.')                 // replace comma with dot
    .replace(/[^\d.-]/g, '');          // remove non-digit/non-dot/non-minus

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Format number to Algerian Dinar style with 2 decimals
export function formatDA(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toLocaleString("fr-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
// ✅ دالة formatDate محسنة للعمل مع جميع الصيغ
