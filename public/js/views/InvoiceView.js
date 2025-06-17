export class InvoiceView {
  constructor(containerId) {
    this.container = document.getElementById(containerId)
    this.previewElements = this.initializePreviewElements()
    this.initializeToastContainer()
  }

  initializePreviewElements() {
    return {
      companyDetails: document.getElementById("preview-company-details"),
      clientDetails: document.getElementById("preview-client-details"),
      invoiceNumber: document.getElementById("preview-invoice-number"),
      invoiceDate: document.getElementById("preview-invoice-date"),
      dueDate: document.getElementById("preview-due-date"),
      itemsTable: document.getElementById("preview-items-table"),
      subtotal: document.getElementById("preview-subtotal"),
      taxLabel: document.getElementById("preview-tax-label"),
      taxAmount: document.getElementById("preview-tax-amount"),
      total: document.getElementById("preview-total"),
      paymentInfo: document.getElementById("preview-payment-info"),
      footerNumber: document.getElementById("preview-footer-number"),
      slogan: document.getElementById("preview-slogan"),
      logo: document.getElementById("preview-logo"),
      signature: document.getElementById("preview-signature"),
      headerImage: document.getElementById("preview-header-image"),
      footerImage: document.getElementById("preview-footer-image"),
      watermark: document.getElementById("preview-watermark"),
      invoicePreview: document.getElementById("invoice-preview"),
    }
  }

  updateCompanyDetails(details) {
    if (this.previewElements.companyDetails) {
      this.previewElements.companyDetails.innerHTML = details.replace(/\n/g, "<br>")
    }
  }

  updateClientDetails(details) {
    if (this.previewElements.clientDetails) {
      this.previewElements.clientDetails.innerHTML = details.replace(/\n/g, "<br>")
    }
  }

  updateInvoiceNumber(number) {
    if (this.previewElements.invoiceNumber) {
      this.previewElements.invoiceNumber.textContent = number
    }
  }

  updateInvoiceDate(date) {
    if (this.previewElements.invoiceDate && date) {
      const formattedDate = new Date(date).toLocaleDateString("fr-FR")
      this.previewElements.invoiceDate.innerHTML = `<span>Date de la facture:</span> <span>${formattedDate}</span>`
    }
  }

  updateDueDate(date) {
    if (this.previewElements.dueDate && date) {
      const formattedDate = new Date(date).toLocaleDateString("fr-FR")
      this.previewElements.dueDate.innerHTML = `<span>Date d'échéance:</span> <span>${formattedDate}</span>`
    }
  }

  updateItems(items, taxRate) {
    if (!this.previewElements.itemsTable) return

    this.previewElements.itemsTable.innerHTML = ""

    items.forEach((item) => {
      const row = document.createElement("tr")
      const amount = item.getTotal()

      const descriptionCell = document.createElement("td")
      descriptionCell.innerHTML =
        item.description +
        (item.details ? `<br><span style="color: #666; font-size: 0.9em;">${item.details}</span>` : "")

      const quantityCell = document.createElement("td")
      quantityCell.textContent = item.quantity.toFixed(3)

      const priceCell = document.createElement("td")
      priceCell.textContent = item.price.toFixed(2)

      const taxCell = document.createElement("td")
      taxCell.textContent = taxRate.toFixed(2) + "%"

      const amountCell = document.createElement("td")
      amountCell.textContent = "$ " + amount.toFixed(2)

      row.appendChild(descriptionCell)
      row.appendChild(quantityCell)
      row.appendChild(priceCell)
      row.appendChild(taxCell)
      row.appendChild(amountCell)

      this.previewElements.itemsTable.appendChild(row)
    })
  }

  updateSummary(subtotal, taxRate, taxAmount, total) {
    if (this.previewElements.subtotal) {
      this.previewElements.subtotal.textContent = "$ " + subtotal.toFixed(2)
    }

    if (this.previewElements.taxLabel) {
      this.previewElements.taxLabel.textContent = `Taxes ${taxRate}%`
    }

    if (this.previewElements.taxAmount) {
      this.previewElements.taxAmount.textContent = "$ " + taxAmount.toFixed(2)
    }

    if (this.previewElements.total) {
      this.previewElements.total.textContent = "$ " + total.toFixed(2)
    }
  }

  updatePaymentInfo(info) {
    if (this.previewElements.paymentInfo) {
      this.previewElements.paymentInfo.innerHTML = info.replace(/\n/g, "<br>")
    }
  }

  updateFooterNumber(number) {
    if (this.previewElements.footerNumber) {
      this.previewElements.footerNumber.textContent = number
    }
  }

  updateSlogan(slogan) {
    if (this.previewElements.slogan) {
      this.previewElements.slogan.textContent = slogan
    }
  }

  updateFont(font) {
    document.body.style.fontFamily = font
  }

  updateColors(primaryColor, secondaryColor) {
    document.documentElement.style.setProperty("--primary-color", primaryColor)
    document.documentElement.style.setProperty("--secondary-color", secondaryColor)
  }

  updateModel(model) {
    if (this.previewElements.invoicePreview) {
      this.previewElements.invoicePreview.classList.remove("model-light", "model-boxed", "model-bold", "model-striped")
      this.previewElements.invoicePreview.classList.add(`model-${model}`)
    }
  }

  updateImage(type, imageData) {
    const elementMap = {
      logoImage: this.previewElements.logo,
      signatureImage: this.previewElements.signature,
      headerImage: this.previewElements.headerImage,
      footerImage: this.previewElements.footerImage,
      watermarkImage: this.previewElements.watermark,
    }

    const element = elementMap[type]
    if (element) {
      if (imageData) {
        element.style.backgroundImage = `url(${imageData})`
        element.style.display = "block"
      } else {
        element.style.backgroundImage = "none"
        element.style.display = "none"
      }
    }
  }

  updateComponentVisibility(activeComponents) {
    // Map component IDs to DOM elements
    const componentMap = {
      logo: this.previewElements.logo,
      "company-details": this.previewElements.companyDetails,
      "client-details": this.previewElements.clientDetails,
      "invoice-number": this.previewElements.invoiceNumber,
      dates: [this.previewElements.invoiceDate, this.previewElements.dueDate],
      "items-table": document.querySelector(".items-table"),
      subtotal: document.querySelector(".summary-row:nth-child(1)"),
      taxes: document.querySelector(".summary-row:nth-child(2)"),
      total: document.querySelector(".summary-row.total"),
      "payment-info": this.previewElements.paymentInfo,
      "footer-number": this.previewElements.footerNumber,
      slogan: this.previewElements.slogan,
      signature: this.previewElements.signature,
      "header-image": this.previewElements.headerImage,
      "footer-image": this.previewElements.footerImage,
      watermark: this.previewElements.watermark,
    }

    // Hide/show components based on active status
    Object.keys(componentMap).forEach((componentId) => {
      const element = componentMap[componentId]
      const isActive = activeComponents.has(componentId)

      if (Array.isArray(element)) {
        // Handle arrays of elements (like dates)
        element.forEach((el) => {
          if (el) el.style.display = isActive ? "block" : "none"
        })
      } else if (element) {
        element.style.display = isActive ? "block" : "none"
      }
    })
  }

  initializeToastContainer() {
    // Check if toast container already exists
    if (document.getElementById("toast-container")) return

    const toastContainer = document.createElement("div")
    toastContainer.id = "toast-container"
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    `

    document.body.appendChild(toastContainer)
  }

  showToast(message, type = "success", duration = 3000) {
    const toastContainer = document.getElementById("toast-container")

    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message

    // Add toast styles if not already added
    if (!document.getElementById("toast-styles")) {
      const style = document.createElement("style")
      style.id = "toast-styles"
      style.textContent = `
        .toast {
          padding: 12px 20px;
          margin-bottom: 10px;
          border-radius: 4px;
          color: white;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          transition: all 0.3s ease;
          transform: translateX(100%);
          opacity: 0;
        }
        .toast-success {
          background-color: #10b981;
        }
        .toast-error {
          background-color: #ef4444;
        }
        .toast-info {
          background-color: #3b82f6;
        }
        .toast-show {
          transform: translateX(0);
          opacity: 1;
        }
      `
      document.head.appendChild(style)
    }

    toastContainer.appendChild(toast)

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("toast-show")
    }, 10)

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove("toast-show")
      setTimeout(() => {
        toastContainer.removeChild(toast)
      }, 300)
    }, duration)
  }

  showError(message) {
    this.showToast(message, "error")
  }

  showSuccess(message) {
    this.showToast(message, "success")
  }
}
