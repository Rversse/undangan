/**
 * rsvp-patch.js
 * Tambahkan kode ini ke script.js undangan lo.
 *
 * CARA PAKAI:
 * 1. Deploy Code.gs sebagai Web App dulu (lihat instruksi di Code.gs)
 * 2. Ganti APPS_SCRIPT_URL di bawah dengan URL Web App lo
 * 3. Cari handler submit form di script.js lo yang sudah ada,
 *    ganti / tambahkan dengan RsvpManager ini
 * 4. Panggil: RsvpManager.init() di bagian bawah script.js
 *    (atau dalam DOMContentLoaded)
 */

// ── Ganti URL ini setelah deploy Apps Script ──────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbys1yuhE6p1IbJI2AGIU84mCBTVmvjG9jSfq-t3L3eHXy-YvxZRMiJF72LZvcFPbsiEVg/exec";


// ─── RSVP Manager ─────────────────────────────────────────────
class RsvpManager {

  /**
   * Ambil data dari form
   */
  static _collectFormData() {
    return {
      nama:   document.querySelector('[name="nama"], #nama, input[placeholder*="Nama"]')?.value?.trim() || "",
      wa:     document.querySelector('[name="wa"], #wa, input[placeholder*="WhatsApp"], input[placeholder*="Nomor"]')?.value?.trim() || "",
      hadir:  document.querySelector('[name="hadir"], #hadir, select')?.value || "",
      jumlah: document.querySelector('[name="jumlah"], #jumlah, select:last-of-type')?.value || "1",
      ucapan: document.querySelector('[name="ucapan"], #ucapan, textarea')?.value?.trim() || "",
    };
  }

  /**
   * Validasi sisi client sebelum kirim
   */
  static _validate(data) {
    if (!data.nama) throw new Error("Nama wajib diisi");
    if (!data.hadir) throw new Error("Mohon pilih konfirmasi kehadiran");
    return true;
  }

  /**
   * Ubah tampilan tombol saat loading
   */
  static _setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Mengirim..." : "Kirim Konfirmasi";
    btn.style.opacity = loading ? "0.7" : "1";
  }

  /**
   * Tampilkan pesan sukses / error
   */
  static _showResult(success, message) {
    // Cari elemen pesan yang sudah ada di HTML, atau buat baru
    let msgEl = document.getElementById("rsvp-message");
    if (!msgEl) {
      msgEl = document.createElement("p");
      msgEl.id = "rsvp-message";
      msgEl.style.cssText = "margin-top:16px;font-size:14px;text-align:center;transition:all .3s;";
      const form = document.querySelector("form, .rsvp-form, #rsvp");
      if (form) form.appendChild(msgEl);
    }
    msgEl.textContent = message;
    msgEl.style.color = success ? "#048A81" : "#c0392b";
    msgEl.style.fontWeight = "600";
  }

  /**
   * Reset form setelah submit sukses
   */
  static _resetForm() {
    const inputs = document.querySelectorAll("form input, form select, form textarea");
    inputs.forEach(el => { el.value = ""; });
  }

  /**
   * Kirim data ke Apps Script
   */
  static async _submit(data) {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      mode: "no-cors", // Apps Script butuh no-cors untuk CORS sederhana
    });

    // no-cors → response jadi opaque, kita asumsikan sukses jika tidak throw
    return { success: true };
  }

  /**
   * Handler utama submit
   */
  static async handleSubmit(e) {
    e.preventDefault();

    const btn = e.target?.querySelector("button[type='submit'], button")
              || document.querySelector(".submit-btn, #submit-btn");

    try {
      RsvpManager._setLoading(btn, true);

      const data = RsvpManager._collectFormData();
      RsvpManager._validate(data);

      await RsvpManager._submit(data);

      RsvpManager._showResult(true, "✅ Terima kasih! Konfirmasi kehadiran kamu sudah kami terima 🤍");
      RsvpManager._resetForm();

    } catch (err) {
      console.error("RSVP error:", err);
      RsvpManager._showResult(false, "❌ " + (err.message || "Gagal mengirim. Coba lagi ya."));
    } finally {
      RsvpManager._setLoading(btn, false);
    }
  }

  /**
   * Init — panggil ini di DOMContentLoaded atau bagian bawah script.js
   *
   * Otomatis detect form RSVP dan attach handler.
   * Jika sudah ada handler submit di script.js, ganti saja dengan ini.
   */
  static init() {
    // Cari form RSVP — sesuaikan selector jika perlu
    const form = document.querySelector("form")
               || document.querySelector(".rsvp-form")
               || document.getElementById("rsvp-form");

    if (!form) {
      console.warn("RsvpManager: Form tidak ditemukan. Cek selector.");
      return;
    }

    // Hapus listener lama jika ada, pasang yang baru
    form.removeEventListener("submit", RsvpManager.handleSubmit);
    form.addEventListener("submit", RsvpManager.handleSubmit);

    console.log("RsvpManager: Siap ✅");
  }
}


// ── Auto-init saat DOM ready ───────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => RsvpManager.init());
} else {
  RsvpManager.init();
}
