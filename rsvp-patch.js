/**
 * rsvp-patch.js — RSVP Handler untuk undangan Taufik & Ati
 *
 * CARA PAKAI:
 * 1. Deploy Code.gs sebagai Web App
 * 2. Ganti APPS_SCRIPT_URL dengan URL deployment lo
 * 3. Di index.html, tambah SETELAH inline <script>:
 *    <script src="rsvp-patch.js"></script>
 * 4. Upload file ini ke repo, replace yang lama
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/GANTI_DENGAN_URL_DEPLOYMENT/exec";

class RsvpManager {

  static _collectFormData() {
    return {
      nama:   document.getElementById("name")?.value?.trim()    || "",
      wa:     document.getElementById("phone")?.value?.trim()   || "",
      hadir:  document.getElementById("attendance")?.value      || "",
      jumlah: document.getElementById("guests")?.value          || "1",
      ucapan: document.getElementById("message")?.value?.trim() || "",
    };
  }

  static _validate(data) {
    if (!data.nama)  throw new Error("Nama wajib diisi");
    if (!data.hadir) throw new Error("Mohon pilih konfirmasi kehadiran");
  }

  static _setLoading(loading) {
    const btn = document.querySelector(".btn-submit");
    if (!btn) return;
    btn.disabled      = loading;
    btn.textContent   = loading ? "Mengirim..." : "Kirim Konfirmasi";
    btn.style.opacity = loading ? "0.6" : "1";
  }

  static _showSuccess() {
    const form    = document.getElementById("rsvpForm");
    const success = document.getElementById("rsvpSuccess");
    if (form)    form.style.display    = "none";
    if (success) success.style.display = "block";
  }

  static _showError(message) {
    let el = document.getElementById("rsvp-error");
    if (!el) {
      el = document.createElement("p");
      el.id = "rsvp-error";
      el.style.cssText =
        "margin-top:12px;color:#c0392b;font-size:0.85rem;text-align:center;";
      document.getElementById("rsvpForm")?.appendChild(el);
    }
    el.textContent = "❌ " + message;
  }

  static async submit(data) {
    // no-cors wajib karena Apps Script tidak support preflight dari GitHub Pages
    await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
      mode:    "no-cors",
    });
    // Response opaque (no-cors) — asumsikan sukses jika tidak throw
  }

  static async handleSubmit(e) {
    e.preventDefault();
    RsvpManager._setLoading(true);

    try {
      const data = RsvpManager._collectFormData();
      RsvpManager._validate(data);
      await RsvpManager.submit(data);
      RsvpManager._showSuccess();
    } catch (err) {
      console.error("RSVP error:", err);
      RsvpManager._showError(err.message || "Gagal mengirim. Coba lagi ya.");
      RsvpManager._setLoading(false);
    }
  }
}

// Override handleRSVP() dari inline script index.html
// File ini HARUS di-load setelah inline <script> biar override jalan
function handleRSVP(e) {
  return RsvpManager.handleSubmit(e);
}
