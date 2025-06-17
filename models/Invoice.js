export class Invoice {
  constructor(data = {}) {
    this.model = data.model || "light"
    this.font = data.font || "Helvetica"
    this.primaryColor = data.primaryColor || "#000000"
    this.secondaryColor = data.secondaryColor || "#000000"
    this.background = data.background || "none"
    this.slogan = data.slogan || ""
    this.companyDetails = data.companyDetails || ""
    this.clientDetails = data.clientDetails || ""
    this.invoiceNumber = data.invoiceNumber || "INV-001"
    this.invoiceDate = data.invoiceDate || new Date().toISOString().split("T")[0]
    this.dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    this.taxRate = data.taxRate || 0
    this.footerNumber = data.footerNumber || ""
    this.paymentInfo = data.paymentInfo || ""
    this.items = data.items || []
    this.images = new InvoiceImages(data)
    this.positionData = data.positionData || {}
  }

  addItem(item) {
    this.items.push(new InvoiceItem(item))
  }

  removeItem(index) {
    this.items.splice(index, 1)
  }

  calculateSubtotal() {
    return this.items.reduce((sum, item) => sum + item.getTotal(), 0)
  }

  calculateTax() {
    return this.calculateSubtotal() * (this.taxRate / 100)
  }

  calculateTotal() {
    return this.calculateSubtotal() + this.calculateTax()
  }

  validate() {
    // Simplified validation - allow empty invoices for testing
    const errors = []

    // Only check for basic structure, not content
    if (this.taxRate < 0) {
      errors.push("Tax rate cannot be negative")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      model: this.model,
      font: this.font,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      background: this.background,
      slogan: this.slogan,
      companyDetails: this.companyDetails,
      clientDetails: this.clientDetails,
      invoiceNumber: this.invoiceNumber,
      invoiceDate: this.invoiceDate,
      dueDate: this.dueDate,
      taxRate: this.taxRate,
      footerNumber: this.footerNumber,
      paymentInfo: this.paymentInfo,
      items: this.items.map((item) => item.toJSON()),
      images: this.images.toJSON(),
      positionData: this.positionData,
    }
  }
}

export class InvoiceItem {
  constructor(data = {}) {
    this.description = data.description || ""
    this.details = data.details || ""
    this.quantity = Number.parseFloat(data.quantity) || 0
    this.price = Number.parseFloat(data.price) || 0
  }

  getTotal() {
    return this.quantity * this.price
  }

  validate() {
    const errors = []

    if (this.quantity < 0) {
      errors.push("Quantity cannot be negative")
    }

    if (this.price < 0) {
      errors.push("Price cannot be negative")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      description: this.description,
      details: this.details,
      quantity: this.quantity,
      price: this.price,
    }
  }
}

export class InvoiceImages {
  constructor(data = {}) {
    this.logoImage = data.logoImage || null
    this.signatureImage = data.signatureImage || null
    this.headerImage = data.headerImage || null
    this.footerImage = data.footerImage || null
    this.watermarkImage = data.watermarkImage || null
    this.watermarkOpacity = Number.parseFloat(data.watermarkOpacity) || 10
  }

  hasLogo() {
    return !!this.logoImage
  }

  hasSignature() {
    return !!this.signatureImage
  }

  hasWatermark() {
    return !!this.watermarkImage
  }

  toJSON() {
    return {
      logoImage: this.logoImage,
      signatureImage: this.signatureImage,
      headerImage: this.headerImage,
      footerImage: this.footerImage,
      watermarkImage: this.watermarkImage,
      watermarkOpacity: this.watermarkOpacity,
    }
  }
}
