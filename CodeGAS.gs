/**
 * RSVP Handler — Google Apps Script Web App
 * Terima POST dari undangan website → tulis ke Sheet Tamu
 * GET ?action=ucapan → kembalikan list ucapan untuk ditampilkan di modal
 *
 * CARA DEPLOY:
 * 1. Buka spreadsheet → Extensions → Apps Script
 * 2. Paste file ini
 * 3. Ganti SPREADSHEET_ID dengan ID spreadsheet (dari URL)
 * 4. Deploy → New deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy Web App URL → paste ke script.js (APPS_SCRIPT_URL)
 *
 * ⚠️  Setiap kali ada perubahan kode, deploy ulang sebagai
 *     "New deployment" (bukan manage existing), agar URL tetap.
 */

// ─── Konfigurasi ─────────────────────────────────────────────
class Config {
  static get SPREADSHEET_ID() {
    return "1qShwUG38Wo8e346bvhNhsAhCYS468BaGdhGTX_IP1Bg";
  }

  static get SHEET_NAME() {
    return "📋 Tamu";
  }

  static get DATA_START_ROW() {
    return 9;
  }

  static get COLS() {
    return {
      NO:        1,  // A
      NAMA:      2,  // B
      WA:        3,  // C — kolom tetap ada di sheet, dikosongkan dari form
      PIHAK:     4,  // D
      TERKIRIM:  5,  // E
      HADIR:     6,  // F
      JUMLAH:    7,  // G
      UCAPAN:    8,  // H
      SUMBER:    9,  // I
      WAKTU:    10,  // J
    };
  }

  static get CORS_HEADERS() {
    return {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
}


// ─── Sheet Manager ────────────────────────────────────────────
class SheetManager {
  constructor() {
    this._ss    = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    this._sheet = this._ss.getSheetByName(Config.SHEET_NAME);
    if (!this._sheet) throw new Error(`Sheet "${Config.SHEET_NAME}" tidak ditemukan.`);
  }

  get sheet() { return this._sheet; }

  getNextRow() {
    const lastRow = this._sheet.getLastRow();
    return Math.max(lastRow + 1, Config.DATA_START_ROW);
  }

  getNextNo() {
    const lastRow = this._sheet.getLastRow();
    if (lastRow < Config.DATA_START_ROW) return 1;
    const lastNo = this._sheet
      .getRange(lastRow, Config.COLS.NO)
      .getValue();
    return (typeof lastNo === "number" && lastNo > 0)
      ? lastNo + 1
      : lastRow - Config.DATA_START_ROW + 2;
  }

  appendRsvp(data) {
    const row  = this.getNextRow();
    const no   = this.getNextNo();
    const cols = Config.COLS;

    this._sheet.getRange(row, cols.NO).setValue(no);
    this._sheet.getRange(row, cols.NAMA).setValue(data.nama);
    this._sheet.getRange(row, cols.WA).setValue("");          // kosong, form tidak kirim WA
    this._sheet.getRange(row, cols.PIHAK).setValue("-");
    this._sheet.getRange(row, cols.TERKIRIM).setValue("✅ Terkirim");
    this._sheet.getRange(row, cols.HADIR).setValue(
      data.hadir === "hadir" ? "Hadir" : "Berhalangan"
    );
    this._sheet.getRange(row, cols.JUMLAH).setValue(Number(data.jumlah) || 1);
    this._sheet.getRange(row, cols.UCAPAN).setValue(data.ucapan || "");
    this._sheet.getRange(row, cols.SUMBER).setValue("RSVP Web");
    this._sheet.getRange(row, cols.WAKTU).setValue(
      Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm")
    );

    return row;
  }

  /**
   * Ambil semua data ucapan yang ada isinya,
   * diurutkan terbaru di atas (reverse).
   */
  getUcapanList() {
    const lastRow = this._sheet.getLastRow();
    if (lastRow < Config.DATA_START_ROW) return [];

    const totalRows = lastRow - Config.DATA_START_ROW + 1;
    const range     = this._sheet.getRange(
      Config.DATA_START_ROW, 1, totalRows, 10
    );
    const values = range.getValues();
    const cols   = Config.COLS;

    const list = values
      .filter(row => {
        const nama   = String(row[cols.NAMA   - 1] || '').trim();
        const ucapan = String(row[cols.UCAPAN - 1] || '').trim();
        return nama && ucapan; // hanya yang punya ucapan
      })
      .map(row => ({
        nama:   String(row[cols.NAMA   - 1] || '').trim(),
        hadir:  String(row[cols.HADIR  - 1] || '').trim(),
        ucapan: String(row[cols.UCAPAN - 1] || '').trim(),
        waktu:  String(row[cols.WAKTU  - 1] || '').trim(),
      }));

    return list.reverse(); // terbaru dulu
  }
}


// ─── RSVP Handler ─────────────────────────────────────────────
class RsvpHandler {
  constructor() {
    this._sheetManager = new SheetManager();
  }

  _validate(data) {
    const errors = [];
    if (!data.nama || data.nama.trim() === "") errors.push("Nama wajib diisi");
    if (!data.hadir) errors.push("Konfirmasi kehadiran wajib dipilih");
    if (errors.length > 0) throw new Error(errors.join(", "));
    return {
      nama:   data.nama.trim(),
      hadir:  data.hadir,
      jumlah: data.jumlah || "1",
      ucapan: (data.ucapan || "").trim(),
    };
  }

  process(rawData) {
    const data = this._validate(rawData);
    const row  = this._sheetManager.appendRsvp(data);
    return {
      success: true,
      message: "RSVP berhasil disimpan. Terima kasih!",
      row: row,
    };
  }
}


// ─── Response Builder ──────────────────────────────────────────
class ResponseBuilder {
  static json(data) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  static error(message) {
    return ResponseBuilder.json({ success: false, message });
  }
}


// ─── Entry Points ──────────────────────────────────────────────

/**
 * POST — terima RSVP dari website
 */
function doPost(e) {
  try {
    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    } else {
      throw new Error("Tidak ada data yang diterima");
    }

    const handler = new RsvpHandler();
    const result  = handler.process(body);
    return ResponseBuilder.json(result);

  } catch (err) {
    console.error("doPost error:", err.message);
    return ResponseBuilder.error(err.message);
  }
}

/**
 * GET — dua mode:
 *   ?action=ucapan  → kembalikan list ucapan untuk modal di website
 *   (default)       → ping / health check
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'ucapan') {
      const sm   = new SheetManager();
      const list = sm.getUcapanList();
      return ResponseBuilder.json({ success: true, data: list });
    }

    // Health check
    return ResponseBuilder.json({
      success: true,
      message: "RSVP endpoint aktif ✅",
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("doGet error:", err.message);
    return ResponseBuilder.error(err.message);
  }
}
