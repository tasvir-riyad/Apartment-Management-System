// Utility functions for Bangla numerals, currency formatting and in-words translation

export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

export function formatCurrency(amount: number, useBanglaDigits = false): string {
  const formatted = `৳${amount.toLocaleString('en-IN')}`;
  if (useBanglaDigits) {
    return `৳${toBanglaDigits(amount.toLocaleString('en-IN'))}`;
  }
  return formatted;
}

// Convert amount to Bengali words for receipts (e.g., 10000 -> দশ হাজার টাকা মাত্র)
export function amountInBengaliWords(amount: number): string {
  if (amount === 0) return 'শূন্য টাকা মাত্র';

  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = [
    'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো',
    'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'
  ];
  const tens = [
    '', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ',
    'ষাট', 'সত্তর', 'আশি', 'নব্বই'
  ];

  // Simple two-digit converter
  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return `${tens[ten]}${rem > 0 ? ' ' + units[rem] : ''}`;
  }

  let crore = Math.floor(amount / 10000000);
  let remainder = amount % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundred = Math.floor(remainder / 100);
  let rest = remainder % 100;

  const parts: string[] = [];

  if (crore > 0) parts.push(`${convertTwoDigits(crore)} কোটি`);
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} লক্ষ`);
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} হাজার`);
  if (hundred > 0) parts.push(`${units[hundred]} শত`);
  if (rest > 0) parts.push(convertTwoDigits(rest));

  return `${parts.join(' ')} টাকা মাত্র`.trim();
}

export function formatDateDhaka(date: Date | string, locale: 'bn' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const formatted = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', options);
  return formatted;
}
