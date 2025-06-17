export class InvoiceModel {
  constructor() {
    this.data = {
      model: "light",
      font: "Lato",
      primaryColor: "#000000",
      secondaryColor: "#000000",
      background: "none",
      slogan: "",
      companyDetails: "",
      clientDetails: "",
      invoiceNumber: "",
      invoiceDate: "",
      dueDate: "",
      taxRate: 15,
      footerNumber: "",
      paymentInfo: "",
      items: [],
      images: {
        logoImage: null,
        signatureImage: null,
        headerImage: null,
        footerImage: null,
        watermarkImage: null,
        watermarkOpacity: 10,
      },
      positionData: {},
    }

    this.observers = []
    this.initializeDefaults()
  }

  initializeDefaults() {
    const today = new Date()
    this.data.invoiceDate = today.toISOString().split("T")[0]

    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(today.getDate() + 30)
    this.data.dueDate = thirtyDaysLater.toISOString().split("T")[0]
  }

  // Observer pattern for data changes
  addObserver(observer) {
    this.observers.push(observer)
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer)
  }

  notifyObservers(property, value) {
    this.observers.forEach((observer) => {
      if (typeof observer.update === "function") {
        observer.update(property, value)
      }
    })
  }

  // Getters and setters with validation
  setModel(model) {
    const validModels = ["light", "boxed", "bold", "striped"]
    if (validModels.includes(model)) {
      this.data.model = model
      this.notifyObservers("model", model)
    }
  }

  setFont(font) {
    this.data.font = font
    this.notifyObservers("font", font)
  }

  setPrimaryColor(color) {
    if (this.isValidColor(color)) {
      this.data.primaryColor = color
      this.notifyObservers("primaryColor", color)
    }
  }

  setSecondaryColor(color) {
    if (this.isValidColor(color)) {
      this.data.secondaryColor = color
      this.notifyObservers("secondaryColor", color)
    }
  }

  setCompanyDetails(details) {
    this.data.companyDetails = details
    this.notifyObservers("companyDetails", details)
  }

  setClientDetails(details) {
    this.data.clientDetails = details
    this.notifyObservers("clientDetails", details)
  }

  setInvoiceNumber(number) {
    this.data.invoiceNumber = number
    this.notifyObservers("invoiceNumber", number)
  }

  setTaxRate(rate) {
    const numRate = Number.parseFloat(rate)
    if (!isNaN(numRate) && numRate >= 0) {
      this.data.taxRate = numRate
      this.notifyObservers("taxRate", numRate)
    }
  }

  addItem(item) {
    const invoiceItem = new InvoiceItem(item)
    this.data.items.push(invoiceItem)
    this.notifyObservers("items", this.data.items)
    return invoiceItem
  }

  removeItem(index) {
    if (index >= 0 && index < this.data.items.length) {
      this.data.items.splice(index, 1)
      this.notifyObservers("items", this.data.items)
    }
  }

  updateItem(index, property, value) {
    if (index >= 0 && index < this.data.items.length) {
      this.data.items[index][property] = value
      this.notifyObservers("items", this.data.items)
    }
  }

  setImage(type, imageData) {
    const validTypes = ["logoImage", "signatureImage", "headerImage", "footerImage", "watermarkImage"]
    if (validTypes.includes(type)) {
      this.data.images[type] = imageData
      this.notifyObservers("images", this.data.images)
    }
  }

  setPosition(elementId, property, value) {
    if (!this.data.positionData[elementId]) {
      this.data.positionData[elementId] = {}
    }
    this.data.positionData[elementId][property] = value
    this.notifyObservers("positionData", this.data.positionData)
  }

  calculateSubtotal() {
    return this.data.items.reduce((sum, item) => sum + item.getTotal(), 0)
  }

  calculateTax() {
    return this.calculateSubtotal() * (this.data.taxRate / 100)
  }

  calculateTotal() {
    return this.calculateSubtotal() + this.calculateTax()
  }

  isValidColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color)
  }

  validate() {
    const errors = []

    if (!this.data.invoiceNumber) {
      errors.push("Invoice number is required")
    }

    if (!this.data.companyDetails) {
      errors.push("Company details are required")
    }

    if (this.data.items.length === 0) {
      errors.push("At least one item is required")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  toJSON() {
    return {
      ...this.data,
      items: this.data.items.map((item) => item.toJSON()),
    }
  }
}

export class InvoiceItem {
  constructor(data = {}) {
    this.description = data.description || ""
    this.details = data.details || ""
    this.quantity = Number.parseFloat(data.quantity) || 1
    this.price = Number.parseFloat(data.price) || 0
  }

  getTotal() {
    return this.quantity * this.price
  }

  validate() {
    const errors = []

    if (!this.description) {
      errors.push("Description is required")
    }

    if (this.quantity <= 0) {
      errors.push("Quantity must be greater than 0")
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
