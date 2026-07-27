/**
 * BuildTrack sync backend — v2
 *
 * WHY THIS UPDATE: the app used to send saves in the URL of a GET
 * request. Google rejects very long URLs, so once a table grew large
 * (sites, roster) its saves silently failed. This version accepts
 * POST requests, which carry the data in the request body — no size
 * limit that matters — while still answering GET for compatibility.
 *
 * HOW TO INSTALL (keeps your existing URL and data):
 *  1. Open your spreadsheet → Extensions → Apps Script
 *  2. Select ALL the old code and replace it with this file. Save.
 *  3. Deploy → Manage deployments → ✎ (edit) → Version: "New version"
 *     → Deploy. DO NOT create a new deployment — editing the existing
 *     one keeps the same Web App URL, so the app keeps working.
 *  4. In BuildTrack: Connect, check your data looks right, then press
 *     "Save all now" once.
 */

var TABLES = ['sites','employees','stocks','purchaseOrders','sales','roster',
              'fees','holidays','machinery','leave','vendors','holders','cashflow','settings','expenses'];

// Leave SHEET_ID empty if you opened this editor from the spreadsheet
// (Extensions → Apps Script). If your script lives at script.google.com
// separately, paste the spreadsheet's ID here (the long code in its URL).
var SHEET_ID = '';
function book() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet bound — paste your spreadsheet ID into SHEET_ID at the top of this script.');
  return ss;
}

function doGet(e)  { return route((e && e.parameter) || {}); }

// ══ ACCESS CONTROL ══════════════════════════════════════════════
// Set YOUR OWN username and password here, then create a NEW
// deployment. Every request must carry the matching credentials —
// without them, nobody can read or write this spreadsheet, even
// with the /exec URL. Leave PASSWORD empty ('') to turn auth off.
var USERNAME = 'admin';
var PASSWORD = 'raiyvina';   // ← CHANGE THIS before deploying!

function authToken_() {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, USERNAME + ':' + PASSWORD);
  return raw.map(function (b) { b = (b + 256) % 256; return (b < 16 ? '0' : '') + b.toString(16); }).join('');
}

function doPost(e) {
  var p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { p = (e && e.parameter) || {}; }
  return route(p);
}

function route(p) {
  var out;
  try {
    var authOn = !!(PASSWORD && PASSWORD.length);
    if (p.action === 'ping') {
      out = { ok: true, v: 4, authRequired: authOn, authOk: !authOn || p.t === authToken_() };
    } else if (authOn && p.t !== authToken_()) {
      out = { ok: false, error: 'auth', v: 4 };
    }
    else if (p.action === 'loadAll') out = { ok: true, v: 4, data: loadAll() };
    else if (p.action === 'save')    out = saveTable(p.table, p.data);
    else                             out = { ok: false, error: 'unknown action' };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ── Reading ────────────────────────────────────────────────────────
function loadAll() {
  var ss = book();
  var data = {};
  TABLES.forEach(function (t) {
    var sh = ss.getSheetByName(t);
    if (!sh || sh.getLastRow() < 2) return;
    var values = sh.getDataRange().getValues();
    var headers = values[0].map(String);
    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = {}, empty = true;
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (!h) continue;
        var v = values[i][c];
        if (v !== '' && v !== null) empty = false;
        row[h] = v instanceof Date ? v.toISOString() : v;
      }
      if (!empty) rows.push(row);
    }
    if (t === 'stocks') {
      // stocks is a keyed object: rebuild it from the __key (or legacy
      // "key") column
      var obj = {};
      rows.forEach(function (r) {
        var k = r.__key !== undefined ? r.__key : r.key;
        if (k === undefined || k === '') return;
        delete r.__key; delete r.key;
        obj[String(k)] = r;
      });
      data[t] = obj;
    } else {
      data[t] = rows;
    }
  });
  return data;
}

// ── Writing ────────────────────────────────────────────────────────
function saveTable(table, json) {
  if (TABLES.indexOf(table) === -1) return { ok: false, error: 'unknown table ' + table };
  var payload = JSON.parse(json || 'null');
  if (payload === null) return { ok: false, error: 'no data' };

  // Convert the keyed stocks object into rows with a __key column
  var rows;
  if (Array.isArray(payload)) {
    rows = payload;
  } else {
    rows = Object.keys(payload).map(function (k) {
      var r = { __key: k };
      var src = payload[k];
      for (var f in src) r[f] = src[f];
      return r;
    });
  }

  // One writer at a time — protects against two tabs saving at once
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = book();
    var sh = ss.getSheetByName(table) || ss.insertSheet(table);

    // Union of every field across every row → header list
    var headers = [];
    rows.forEach(function (r) {
      for (var f in r) if (headers.indexOf(f) === -1) headers.push(f);
    });
    if (!headers.length) { sh.clearContents(); return { ok: true, v: 4, rows: 0 }; }

    var grid = [headers];
    rows.forEach(function (r) {
      grid.push(headers.map(function (h) {
        var v = r[h];
        if (v === undefined || v === null) return '';
        if (typeof v === 'object') return JSON.stringify(v);   // logs, items, ss …
        return v;
      }));
    });

    sh.clearContents();
    sh.getRange(1, 1, grid.length, headers.length).setValues(grid);
    return { ok: true, v: 4, rows: rows.length };
  } finally {
    lock.releaseLock();
  }
}
