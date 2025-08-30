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
    // Convert static QRIS to dynamic QRIS manually
    const dynamicQRISString = convertQRISToDynamic(QRIS_STATIC, numericAmount);

    // Use online QR generator API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      dynamicQRISString
    )}`;

    const qrisImageElement = document.getElementById("qrisImage");
    qrisImageElement.src = qrApiUrl;
    qrisImageElement.classList.add("dynamic");

    // Store for download
    currentQRISData = {
      dataUrl: qrApiUrl,
      amount: numericAmount,
      type: "dynamic",
      qrisString: dynamicQRISString,
    };

    // Show success message
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

    // Fallback to static QRIS
    const qrisImageElement = document.getElementById("qrisImage");
    qrisImageElement.src = "qris zetttt.jpg";
    qrisImageElement.classList.remove("dynamic");

    // Store static for download
    currentQRISData = {
      dataUrl: "qris zetttt.jpg",
      amount: numericAmount,
      type: "static",
    };

    // Show error message but continue with static
    document.getElementById(
      "statusMessage"
    ).innerHTML = `<div class="error-message">⚠️ Gagal membuat QRIS dinamis. Menampilkan QRIS statis sebagai alternatif.</div>`;

    showToast("Gagal membuat QRIS dinamis, pakai QRIS statis dulu ya", "error");
  }

  // Show result step
  showModalStep("resultStep");
}

function downloadQRIS() {
  if (!currentQRISData) {
    // Fallback to static download
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
    // Download dynamic QRIS (base64)
    const link = document.createElement("a");
    link.href = currentQRISData.dataUrl;
    link.download = `QRIS-Feza-Rp${parseInt(
      currentQRISData.amount
    ).toLocaleString("id-ID")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      `QRIS dinamis Rp ${parseInt(currentQRISData.amount).toLocaleString(
        "id-ID"
      )} berhasil didownload!`,
      "success"
    );
  } else {
    // Download static QRIS
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
      // Fallback for older browsers
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
  // Remove existing toast
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Add icon based on type
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

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Format number with thousand separators
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse formatted number to numeric value
function parseFormattedNumber(formatted) {
  return parseInt(formatted.replace(/\./g, ""));
}

// Format input value in real-time
function formatAmountInput(input) {
  let value = input.value.replace(/\./g, ""); // Remove existing dots
  value = value.replace(/[^0-9]/g, ""); // Keep only numbers

  if (value) {
    input.value = formatNumber(value);
  } else {
    input.value = "";
  }
}

// Enter key support and input formatting
document.addEventListener("DOMContentLoaded", function () {
  const amountInput = document.getElementById("amountInput");
  if (amountInput) {
    // Format on input
    amountInput.addEventListener("input", function (e) {
      formatAmountInput(e.target);
    });

    // Prevent non-numeric input
    amountInput.addEventListener("keypress", function (e) {
      // Allow Enter for submit
      if (e.key === "Enter") {
        generateQRIS();
        return;
      }

      // Allow only numbers
      if (
        !/[0-9]/.test(e.key) &&
        !["Backspace", "Delete", "Tab", "Escape", "Enter"].includes(e.key)
      ) {
        e.preventDefault();
      }
    });

    // Handle paste
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

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("qrisModal");
  if (event.target === modal) {
    closeQRIS();
  }
};

// Close modal with escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeQRIS();
  }
});
