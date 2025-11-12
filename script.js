/* ===================================
   REKENING FEZA - MINIMALIST FINTECH
   JavaScript Functions
   =================================== */

// Show QRIS modal with smooth animation
function showQRIS() {
  const modal = document.getElementById("qrisModal");
  modal.style.display = "flex";
  // Trigger animation
  setTimeout(() => {
    modal.querySelector(".modal-content").style.opacity = "1";
  }, 10);
}

// Close QRIS modal
function closeQRIS() {
  const modal = document.getElementById("qrisModal");
  const modalContent = modal.querySelector(".modal-content");
  
  // Fade out animation
  modalContent.style.opacity = "0";
  
  setTimeout(() => {
    modal.style.display = "none";
    modalContent.style.opacity = "1";
  }, 200);
}

// Download QRIS image
function downloadQRIS() {
  try {
    // Simple direct download - no API needed
    const link = document.createElement("a");
    link.href = "img/qris zetttt.jpg";
    link.download = "QRIS-Feza.jpg";
    link.click();
    
    showToast("QRIS berhasil didownload!", "success");
  } catch (error) {
    console.error("Download error:", error);
    showToast("Gagal download QRIS", "error");
  }
}

// Copy text to clipboard
function copyToClipboard(number, bank) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(number)
      .then(() => {
        showToast(`${bank} ${number} berhasil disalin!`, "success");
      })
      .catch(() => {
        fallbackCopy(number, bank);
      });
  } else {
    fallbackCopy(number, bank);
  }
}

// Fallback copy method for older browsers
function fallbackCopy(number, bank) {
  const textArea = document.createElement("textarea");
  textArea.value = number;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand("copy");
    showToast(`${bank} ${number} berhasil disalin!`, "success");
  } catch (err) {
    showToast("Gagal menyalin nomor rekening", "error");
  }
  
  document.body.removeChild(textArea);
}

// Show toast notification
function showToast(message, type = "default") {
  // Remove existing toast if any
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Add icon based on type
  let icon = "";
  if (type === "success") {
    icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
  } else if (type === "error") {
    icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>`;
  } else {
    icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3000);
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("qrisModal");
  if (event.target === modal || event.target.classList.contains("modal-backdrop")) {
    closeQRIS();
  }
};

// Close modal on Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("qrisModal");
    if (modal.style.display === "flex") {
      closeQRIS();
    }
  }
});

// Prevent clicks inside modal content from closing modal
document.addEventListener("DOMContentLoaded", function() {
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    modalContent.addEventListener("click", function(e) {
      e.stopPropagation();
    });
  }
});
