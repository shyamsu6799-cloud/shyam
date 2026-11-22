const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const inrPreciseFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, showDecimals = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return showDecimals ? inrPreciseFormatter.format(safe) : inrFormatter.format(safe);
}

export function formatINRPlain(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `Rs. ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)}`;
}

export function formatINRCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeDisplay(hhmm: string): string {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  const [hh, mm] = hhmm.split(':').map(Number);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

export function getMonthName(monthIndex: number): string {
  return new Date(2026, monthIndex, 1).toLocaleDateString('en-IN', { month: 'short' });
}

export function getFullMonthName(monthIndex: number): string {
  return new Date(2026, monthIndex, 1).toLocaleDateString('en-IN', { month: 'long' });
}

export function getWeekBounds(anchorIso: string): { start: string; end: string } {
  const [y, m, d] = anchorIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(date);
  mon.setDate(date.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: toLocalISO(mon),
    end: toLocalISO(sun),
  };
}

export function getMonthBounds(year: number, monthIndex: number): { start: string; end: string } {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  return { start: toLocalISO(first), end: toLocalISO(last) };
}

export function getQuarterBounds(year: number, quarter: 1 | 2 | 3 | 4): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3;
  const first = new Date(year, startMonth, 1);
  const last = new Date(year, startMonth + 3, 0);
  return { start: toLocalISO(first), end: toLocalISO(last) };
}

export function getHalfYearBounds(year: number, half: 1 | 2): { start: string; end: string } {
  const startMonth = half === 1 ? 0 : 6;
  const first = new Date(year, startMonth, 1);
  const last = new Date(year, startMonth + 6, 0);
  return { start: toLocalISO(first), end: toLocalISO(last) };
}

export function getYearBounds(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function compressReceiptImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPG, PNG, or WebP).');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image file must be under 15 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        const maxDim = 1100;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize image processor.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
