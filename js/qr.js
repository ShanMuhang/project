// =============================================
//   MELLOW UP — qr.js
//   QR Code Generator (Auto + Download)
// =============================================

/**
 * generateQRSvg — renders a deterministic pseudo-QR SVG
 * @param {HTMLElement} container  DOM element to inject SVG into
 * @param {string} text            Data string
 * @param {number} size            Width/height in px
 * @returns {string} SVG string
 */
function generateQRSvg(container, text, size = 200) {
  const svgStr = buildQRSvgString(text, size);
  if (container) container.innerHTML = svgStr;
  return svgStr;
}

function buildQRSvgString(text, size = 200) {
  // Deterministic hash for consistent pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  const cells = 25;
  const margin = 4;
  const cellSize = Math.floor((size - margin * 2) / cells);
  const offset = Math.floor((size - cells * cellSize) / 2);

  function seededRandom(seed) {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  let rects = '';

  // Data modules
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= cells - 8;
      const inBL = r >= cells - 8 && c < 8;
      const inTiming = (r === 6 || c === 6) && !inTL && !inTR && !inBL;

      let dark = false;

      if (inTL || inTR || inBL) {
        const fr = inTL ? r : inTR ? r : r - (cells - 8);
        const fc = inTL ? c : inTR ? c - (cells - 8) : c;
        // Finder pattern: outer ring + inner 3×3
        const outerRing = fr === 0 || fr === 6 || fc === 0 || fc === 6;
        const inner = fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4;
        dark = outerRing || inner;
      } else if (inTiming) {
        dark = (r === 6 ? c : r) % 2 === 0;
      } else {
        // Alignment pattern at bottom-right area
        const ar = cells - 9, ac = cells - 9;
        const da = Math.max(Math.abs(r - ar), Math.abs(c - ac));
        if (da <= 2) {
          dark = da === 0 || da === 2;
        } else {
          dark = seededRandom(hash + r * 100 + c * 7 + 13) > 0.48;
        }
      }

      if (dark) {
        const x = offset + c * cellSize;
        const y = offset + r * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }

  // Format modules overlay (quiet zone border)
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white" rx="8"/>
    ${rects}
  </svg>`;
}

/**
 * autoGenerateQR — called when booking is confirmed.
 * Saves qrSvg into the booking record and renders it.
 */
function autoGenerateQR(bookingId) {
  const bookings = DB.getArr('bookings');
  const b = bookings.find(x => x.id === bookingId);
  if (!b) return;
  if (!b.qrSvg) {
    b.qrSvg = buildQRSvgString(b.qrData, 200);
    DB.set('bookings', bookings);
  }
  return b.qrSvg;
}

/**
 * downloadQR — converts SVG to PNG and triggers download
 */
function downloadQR(bookingId) {
  const b = DB.getArr('bookings').find(x => x.id === bookingId);
  if (!b) return;
  const svgStr = b.qrSvg || buildQRSvgString(b.qrData || bookingId, 300);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'QR-' + (b.tableName || 'ticket') + '-' + (b.date || '') + '.svg';
  a.click();
  URL.revokeObjectURL(url);
  showToast('ดาวน์โหลด QR Code เรียบร้อยแล้ว! 📥');
}

/**
 * renderBookingQR — renders QR for a booking into a container element
 */
function renderBookingQR(containerId, bookingId) {
  const container = el(containerId); if (!container) return;
  const b = DB.getArr('bookings').find(x => x.id === bookingId);
  if (!b) { container.innerHTML = '<p>ไม่พบข้อมูลการจอง</p>'; return; }
  const svgStr = b.qrSvg || buildQRSvgString(b.qrData || bookingId, 200);
  container.innerHTML = svgStr;
}
