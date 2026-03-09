// =============================================
//   MELLOW UP — db.js
//   localStorage wrapper + global state
// =============================================

const DB = {
  get:    k    => { try { return JSON.parse(localStorage.getItem('mu_' + k)); } catch { return null; } },
  set:    (k,v)=> localStorage.setItem('mu_' + k, JSON.stringify(v)),
  getArr: k    => { const v = DB.get(k); return Array.isArray(v) ? v : []; },
  remove: k    => localStorage.removeItem('mu_' + k),
};

/* ===== GLOBAL STATE ===== */
let currentUser   = null;
let currentAdmin  = null;
let isAdmin       = false;
let pageHistory   = [];
let bookingDraft  = {};
let guestCount    = 2;
let selectedTable = null;
let slipDataUrl   = null;
let currentPayTab = 'promptpay';
