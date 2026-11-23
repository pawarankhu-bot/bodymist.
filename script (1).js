/* ==========================================================================
   BODY SCENT — Shared Application Script
   Used across: index.html, product.html, order.html, thankyou.html, admin.html
   ========================================================================== */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwm8Xpd0iard5xximBZx2MpdlHsq9a1Pdd3xdc8T1VB2kIoMFAU-lQQSPUC-QUVe-nc/exec';

// ใส่ลิงก์ Google Sheets Publish to Web (รูปแบบ CSV) แทนที่ [CSV_URL]
const CSV_URL = '[CSV_URL]';

const MOOD_LABELS = {
  all: 'ทั้งหมด',
  fresh: 'Fresh',
  sweet: 'Sweet',
  confident: 'Confident',
  romance: 'Romance',
};

const TYPE_LABELS = {
  spray: 'Body Mist',
  rollon: 'Roll-On',
};

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initProductPage();
  initOrderPage();
  initAdminPage();
});

/* ==========================================================================
   1. Mobile Navigation Toggle (ทุกหน้า)
   ========================================================================== */
function initMobileNav() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

/* ==========================================================================
   2. หน้าสินค้า (product.html) — #filter-bar, #product-list
   ========================================================================== */
function initProductPage() {
  const productListEl = document.getElementById('product-list');
  const filterBarEl = document.getElementById('filter-bar');

  // ทำงานเฉพาะหน้าที่มี #product-list
  if (!productListEl) return;

  const params = new URLSearchParams(window.location.search);
  const moodParam = (params.get('mood') || 'all').toLowerCase().trim();
  const validMoods = ['all', 'fresh', 'sweet', 'confident', 'romance'];
  let currentMood = validMoods.includes(moodParam) ? moodParam : 'all';
  let allProducts = [];

  setupFilterBar(filterBarEl, currentMood, (selectedMood) => {
    currentMood = selectedMood;
    updateMoodQueryParam(currentMood);
    renderProductCards(productListEl, allProducts, currentMood);
  });

  fetch('products.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      allProducts = Array.isArray(data) ? data : [];
      renderProductCards(productListEl, allProducts, currentMood);
    })
    .catch((error) => {
      console.error('Error loading products.json:', error);
      productListEl.innerHTML = `
        <p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 3rem 0;">
          ไม่สามารถโหลดรายการสินค้าได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      `;
    });
}

function setupFilterBar(filterBarEl, activeMood, onMoodChange) {
  if (!filterBarEl) return;

  let buttons = filterBarEl.querySelectorAll('[data-mood], [data-filter-mood]');

  // หากยังไม่มีปุ่มใน #filter-bar ให้สร้างปุ่มกรองอัตโนมัติ
  if (buttons.length === 0) {
    filterBarEl.innerHTML = `
      <div class="filter-group">
        <span class="filter-label">เลือก Mood :</span>
        ${Object.entries(MOOD_LABELS)
          .map(([moodKey, label]) => {
            const dotHtml =
              moodKey !== 'all'
                ? `<span class="mood-dot ${moodKey}"></span>`
                : '';
            return `
              <button type="button" class="filter-btn" data-filter-mood="${moodKey}">
                ${dotHtml}
                <span>${label}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    `;
    buttons = filterBarEl.querySelectorAll('[data-filter-mood]');
  }

  const getBtnMood = (btn) =>
    (
      btn.getAttribute('data-filter-mood') ||
      btn.getAttribute('data-mood') ||
      'all'
    ).toLowerCase();

  const updateActiveState = (targetMood) => {
    buttons.forEach((btn) => {
      btn.classList.toggle('active', getBtnMood(btn) === targetMood);
    });
  };

  updateActiveState(activeMood);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedMood = getBtnMood(btn);
      updateActiveState(selectedMood);
      onMoodChange(selectedMood);
    });
  });
}

function updateMoodQueryParam(mood) {
  if (!window.history || !window.history.replaceState) return;
  const url = new URL(window.location.href);
  if (mood === 'all') {
    url.searchParams.delete('mood');
  } else {
    url.searchParams.set('mood', mood);
  }
  window.history.replaceState({}, '', url);
}

function renderProductCards(container, products, moodFilter) {
  const filteredProducts =
    moodFilter === 'all'
      ? products
      : products.filter(
          (item) => (item.mood || '').toLowerCase() === moodFilter
        );

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 3rem 0;">
        ไม่พบสินค้าในหมวดหมู่ที่เลือก
      </p>
    `;
    return;
  }

  container.innerHTML = filteredProducts
    .map((product) => {
      const moodKey = (product.mood || '').toLowerCase();
      const moodLabel = MOOD_LABELS[moodKey] || product.mood || '';
      const typeLabel = TYPE_LABELS[product.type] || product.type || '';
      const orderUrl = `order.html?item=${encodeURIComponent(
        product.name
      )}&price=${encodeURIComponent(product.price)}`;

      return `
        <article class="product-card" data-mood="${escapeHtml(moodKey)}">
          <div class="product-image-wrap">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
            ${
              typeLabel
                ? `<span class="product-type-tag">${escapeHtml(typeLabel)}</span>`
                : ''
            }
          </div>
          <div class="product-info">
            <div class="product-mood-tag">
              <span class="mood-dot ${escapeHtml(moodKey)}"></span>
              <span>${escapeHtml(moodLabel)}</span>
            </div>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <p class="product-size">ขนาด ${escapeHtml(product.size)}</p>
            ${
              product.description
                ? `<p class="product-desc">${escapeHtml(product.description)}</p>`
                : ''
            }
            <div class="product-footer">
              <div class="product-price">
                ${Number(product.price).toLocaleString()} <span>บาท</span>
              </div>
              <a href="${orderUrl}" class="btn btn-primary btn-sm">สั่งซื้อ</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================================
   3. หน้าสั่งซื้อ (order.html) — #orderForm, #customerName, #contact, #items, #total, #note
   ========================================================================== */
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // ทำงานเฉพาะหน้าที่มีฟอร์มสั่งซื้อหรือช่อง items/total
  if (!orderForm && !itemsInput && !totalInput) return;

  // อ่านค่า item และ price จาก URL parameter แล้วเติมลงฟอร์มทันที
  const params = new URLSearchParams(window.location.search);
  const itemParam = params.get('item');
  const priceParam = params.get('price');

  if (itemsInput && itemParam !== null) {
    itemsInput.value = itemParam;
  }

  if (totalInput && priceParam !== null) {
    totalInput.value = priceParam;
  }

  if (!orderForm) return;

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const customerNameEl = document.getElementById('customerName');
    const contactEl = document.getElementById('contact');
    const noteEl = document.getElementById('note');

    const payload = {
      customerName: customerNameEl ? customerNameEl.value.trim() : '',
      contact: contactEl ? contactEl.value.trim() : '',
      items: itemsInput ? itemsInput.value.trim() : '',
      total: totalInput ? totalInput.value.trim() : '',
      note: noteEl ? noteEl.value.trim() : '',
    };

    const submitBtn = orderForm.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    fetch(
      'https://script.google.com/macros/s/AKfycbwm8Xpd0iard5xximBZx2MpdlHsq9a1Pdd3xdc8T1VB2kIoMFAU-lQQSPUC-QUVe-nc/exec',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
  });
}

/* ==========================================================================
   4. หน้าแอดมิน (admin.html) — #ordersTable tbody
   ========================================================================== */
function initAdminPage() {
  const tableBody = document.querySelector('#ordersTable tbody');

  // ทำงานเฉพาะหน้าที่มี #ordersTable tbody
  if (!tableBody) return;

  if (!CSV_URL || CSV_URL === '[CSV_URL]') {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
          กรุณากำหนดค่า CSV_URL ในไฟล์ script.js เพื่อเชื่อมต่อข้อมูลคำสั่งซื้อ
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
        กำลังโหลดรายการคำสั่งซื้อ...
      </td>
    </tr>
  `;

  fetch(CSV_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((csvText) => {
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
              ยังไม่มีรายการคำสั่งซื้อ
            </td>
          </tr>
        `;
        return;
      }

      // ตรวจสอบและตัดแถวหัวตาราง (Header) ออก หากมี
      const firstRowText = rows[0].join(' ').toLowerCase();
      const hasHeader =
        firstRowText.includes('วันเวลา') ||
        firstRowText.includes('timestamp') ||
        firstRowText.includes('date') ||
        firstRowText.includes('ชื่อลูกค้า') ||
        firstRowText.includes('customer');

      const dataRows = hasHeader ? rows.slice(1) : rows;

      // กรองแถวว่างออก และเรียงจากรายการล่าสุดขึ้นก่อน
      const validOrders = dataRows
        .filter((row) => row.some((cell) => cell.trim() !== ''))
        .reverse();

      if (validOrders.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
              ยังไม่มีรายการคำสั่งซื้อ
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = validOrders
        .map((cols) => {
          const timestamp = cols[0] || '-';
          const customerName = cols[1] || '-';
          const contact = cols[2] || '-';
          const items = cols[3] || '-';
          const rawTotal = (cols[4] || '').trim();
          const note = (cols[5] || '').trim() || '-';

          const numericTotal = Number(rawTotal.replace(/,/g, ''));
          const formattedTotal =
            rawTotal !== '' && !Number.isNaN(numericTotal)
              ? `${numericTotal.toLocaleString()} บาท`
              : rawTotal || '-';

          return `
            <tr>
              <td>${escapeHtml(timestamp)}</td>
              <td>${escapeHtml(customerName)}</td>
              <td>${escapeHtml(contact)}</td>
              <td>${escapeHtml(items)}</td>
              <td>${escapeHtml(formattedTotal)}</td>
              <td>${escapeHtml(note)}</td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => {
      console.error('Error loading CSV:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
            ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้ กรุณาตรวจสอบลิงก์ CSV_URL
          </td>
        </tr>
      `;
    });
}

/* ==========================================================================
   Custom CSV Parser (ไม่ใช้ Library ภายนอก — รองรับเครื่องหมายคำพูดและลูกน้ำในช่อง)
   ========================================================================== */
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  // ลบ UTF-8 BOM หากมี
  const text = csvText.replace(/^﻿/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        // เครื่องหมายคำพูดซ้อน ("") แทนตัวอักษร "
        currentField += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '' && nextChar === '
') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '
' || char === '') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // เก็บฟิลด์และแถวสุดท้าย (กรณีไฟล์ไม่ได้ลงท้ายด้วยขึ้นบรรทัดใหม่)
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

/* ==========================================================================
   Utility: Escape HTML
   ========================================================================== */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
