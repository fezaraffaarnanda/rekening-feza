// Global variables
let currentQRISData = null;
const QRIS_STATIC =
  "00020101021126610014COM.GO-JEK.WWW01189360091432838524910210G2838524910303UMI51440014ID.CO.QRIS.WWW0215ID10253705913290303UMI5204581553033605802ID5911ZETT, JTNGR6013JAKARTA TIMUR61051333062070703A016304B3BE";

// CRC16 calculation function (converted from PHP)
function convertCRC16(str) {
  function charCodeAt(str, i) {
    return str.charCodeAt(i);
  }

  let crc = 0xffff;
  const strlen = str.length;

  for (let c = 0; c < strlen; c++) {
    crc ^= charCodeAt(str, c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  let hex = (crc & 0xffff).toString(16).toUpperCase();
  if (hex.length === 3) hex = "0" + hex;
  return hex;
}

// Convert static QRIS to dynamic QRIS (converted from PHP)
function convertQRISToDynamic(staticQRIS, amount) {
  // Remove last 4 characters (CRC)
  let qris = staticQRIS.substring(0, staticQRIS.length - 4);

  // Replace static indicator with dynamic indicator
  let step1 = qris.replace("010211", "010212");

  // Split by "5802ID"
  let parts = step1.split("5802ID");

  // Format amount: "54" + length (2 digits) + amount
  let amountStr = amount.toString();
  let formattedAmount =
    "54" + amountStr.length.toString().padStart(2, "0") + amountStr;

  // Reconstruct QRIS
  let dynamicQRIS = parts[0] + formattedAmount + "5802ID" + parts[1];

  // Calculate and append CRC16
  dynamicQRIS += convertCRC16(dynamicQRIS);

  return dynamicQRIS;
}

function showQRIS() {
  document.getElementById("qrisModal").style.display = "block";
  resetQRISModal();
}

function closeQRIS() {
  document.getElementById("qrisModal").style.display = "none";
  resetQRISModal();
}

function resetQRISModal() {
  // Reset to input step
  showModalStep("inputStep");

  // Clear input
  document.getElementById("amountInput").value = "";

  // Clear status message
  document.getElementById("statusMessage").innerHTML = "";

  // Reset image to static QRIS
  const qrisImageElement = document.getElementById("qrisImage");
  qrisImageElement.src = "qris zetttt.jpg";
  qrisImageElement.classList.remove("dynamic");

  // Reset download link data
  currentQRISData = null;
}

function showModalStep(stepId) {
  // Hide all steps
  const steps = document.querySelectorAll(".modal-step");
  steps.forEach((step) => step.classList.remove("active"));

  // Show target step
  document.getElementById(stepId).classList.add("active");
}

async function generateQRIS() {
  const amountInput = document.getElementById("amountInput");
  const amount = amountInput.value.trim();

  // Parse number (remove dots)
  const numericAmount = parseInt(amount.replace(/\./g, ""));

  // Validation
  if (!amount || isNaN(numericAmount) || numericAmount < 1) {
    showToast("Minimal Rp 1 ya", "error");
    return;
  }

  if (numericAmount > 10000000) {
    showToast("Maksimal Rp 10.000.000", "error");
    return;
  }

  // Show loading step
  showModalStep("loadingStep");

  try {
    // konversi static qris ke dynamic qris
    const dynamicQRISString = convertQRISToDynamic(QRIS_STATIC, numericAmount);

    // online qr generator
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      dynamicQRISString
    )}`;

    const qrisImageElement = document.getElementById("qrisImage");
    qrisImageElement.src = qrApiUrl;
    qrisImageElement.classList.add("dynamic");

    // simpan untuk download
    currentQRISData = {
      dataUrl: qrApiUrl,
      amount: numericAmount,
      type: "dynamic",
      qrisString: dynamicQRISString,
    };

    // tampilkan pesan sukses
    document.getElementById(
      "statusMessage"
    ).innerHTML = `<div class="success-message">
      ✅ QRIS dinamis berhasil dibuat untuk Rp ${numericAmount.toLocaleString(
        "id-ID"
      )}
    </div>`;

    showToast(
      `QRIS Rp ${numericAmount.toLocaleString("id-ID")} sudah siap!`,
      "success"
    );
  } catch (error) {
    console.error("QRIS Generation Error:", error);

    // fallback ke dinamis qris
    const qrisImageElement = document.getElementById("qrisImage");
    qrisImageElement.src = "qris zetttt.jpg";
    qrisImageElement.classList.remove("dynamic");

    // simpan untuk download
    currentQRISData = {
      dataUrl: "qris zetttt.jpg",
      amount: numericAmount,
      type: "static",
    };

    // tampilkan pesan error
    document.getElementById(
      "statusMessage"
    ).innerHTML = `<div class="error-message">⚠️ Gagal membuat QRIS statis. Menampilkan QRIS dinamis sebagai alternatif.</div>`;

    showToast("Gagal membuat QRIS statis, pakai QRIS dinamis dulu ya", "error");
  }

  // tampilkan step hasil
  showModalStep("resultStep");
}

async function downloadQRIS() {
  if (!currentQRISData) {
    // fallback ke dinamis
    const link = document.createElement("a");
    link.href = "qris zetttt.jpg";
    link.download = "QRIS-Feza.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("QRIS berhasil didownload!", "success");
    return;
  }

  if (currentQRISData.type === "dynamic") {
    try {
      // tampilkan pesan loading
      showToast("Sedang menyiapkan download...", "default");

      // fetch image dari API dan convert ke blob
      const response = await fetch(currentQRISData.dataUrl);
      const blob = await response.blob();

      // buat object URL dari blob
      const objectUrl = URL.createObjectURL(blob);

      // download image
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `QRIS-Feza-Rp${parseInt(
        currentQRISData.amount
      ).toLocaleString("id-ID")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // hapus object URL
      URL.revokeObjectURL(objectUrl);

      showToast(
        `QRIS Rp ${parseInt(currentQRISData.amount).toLocaleString(
          "id-ID"
        )} berhasil didownload!`,
        "success"
      );
    } catch (error) {
      console.error("Download error:", error);
      showToast("Gagal download QRIS, coba lagi ya", "error");
    }
  } else {
    // download static qris
    const link = document.createElement("a");
    link.href = "qris zetttt.jpg";
    link.download = "QRIS-Feza.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("QRIS berhasil didownload!", "success");
  }
}

function copyToClipboard(number, bank) {
  navigator.clipboard
    .writeText(number)
    .then(() => {
      showToast(`${bank} ${number} berhasil disalin!`, "success");
    })
    .catch(() => {
      // fallback untuk browser lama
      const textArea = document.createElement("textarea");
      textArea.value = number;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast(`${bank} ${number} berhasil disalin!`, "success");
    });
}

function showToast(message, type = "default") {
  // hapus toast yang sudah ada
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // buat toast baru
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // tambahkan icon berdasarkan type
  let icon;
  if (type === "success") {
    icon = `<svg class="copy-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  } else if (type === "error") {
    icon = `<svg class="copy-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  } else {
    icon = `<svg class="copy-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  }

  toast.innerHTML = `${icon}${message}`;
  document.body.appendChild(toast);

  // hapus toast setelah 3 detik
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// format number dengan ribuan
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// parse formatted number ke numeric value
function parseFormattedNumber(formatted) {
  return parseInt(formatted.replace(/\./g, ""));
}

// format input value ke real-time
function formatAmountInput(input) {
  let value = input.value.replace(/\./g, ""); // hapus titik yang sudah ada
  value = value.replace(/[^0-9]/g, ""); // hanya angka

  if (value) {
    input.value = formatNumber(value);
  } else {
    input.value = "";
  }
}

// enter key support dan format input
document.addEventListener("DOMContentLoaded", function () {
  const amountInput = document.getElementById("amountInput");
  if (amountInput) {
    // format di input
    amountInput.addEventListener("input", function (e) {
      formatAmountInput(e.target);
    });

    // hanya angka
    amountInput.addEventListener("keypress", function (e) {
      // allow enter untuk submit
      if (e.key === "Enter") {
        generateQRIS();
        return;
      }

      // hanya angka
      if (
        !/[0-9]/.test(e.key) &&
        !["Backspace", "Delete", "Tab", "Escape", "Enter"].includes(e.key)
      ) {
        e.preventDefault();
      }
    });

    // paste
    amountInput.addEventListener("paste", function (e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      const numericValue = paste.replace(/[^0-9]/g, "");
      if (numericValue) {
        e.target.value = formatNumber(numericValue);
      }
    });
  }
});

// close modal ketika klik di luar
window.onclick = function (event) {
  const modal = document.getElementById("qrisModal");
  if (event.target === modal) {
    closeQRIS();
  }
};

// close modal ketika tekan escape
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeQRIS();
  }
});
