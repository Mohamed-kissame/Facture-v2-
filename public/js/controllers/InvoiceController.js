import { InvoiceModel, InvoiceItem } from "../models/InvoiceModel.js"
import { InvoiceView } from "../views/InvoiceView.js"
import { ImageManager } from "../services/ImageManager.js"
import { PositionManager } from "../services/PositionManager.js"
import { ComponentLibraryService } from "../services/ComponentLibraryService.js"
import { ComponentMenuView } from "../views/ComponentMenuView.js"
import { ComponentManager } from "../services/ComponentManager.js"

export class InvoiceController {
  constructor() {
    this.model = new InvoiceModel()
    this.view = new InvoiceView("invoice-preview")
    this.imageManager = new ImageManager(this.model)
    this.positionManager = new PositionManager(this.model)

    // Initialize component library
    this.componentLibrary = new ComponentLibraryService()
    this.componentMenu = new ComponentMenuView(this.componentLibrary, this)

    // Initialize component manager
    this.componentManager = new ComponentManager(this)

    // Initialize UI
    this.setupModelObserver()
    this.setupFormListeners()
    this.setupButtonListeners()

    // Initialize component menu
    this.componentMenu.initialize()

    // Initialize form with default values
    this.initializeFormValues()

    // Initialize active components
    this.activeComponents = new Set([
      "company-details",
      "client-details",
      "invoice-number",
      "dates",
      "items-table",
      "subtotal",
      "taxes",
      "total",
    ])
  }

  initializeFormValues() {
    // Set default values in form inputs
    document.getElementById("invoice-date").value = this.model.data.invoiceDate
    document.getElementById("due-date").value = this.model.data.dueDate
    document.getElementById("tax-rate").value = this.model.data.taxRate

    // Trigger initial preview update
    this.updatePreview()
  }

  setupModelObserver() {
    this.model.addObserver({
      update: (property, value) => {
        this.handleModelUpdate(property, value)
      },
    })
  }

  handleModelUpdate(property, value) {
    switch (property) {
      case "companyDetails":
        this.view.updateCompanyDetails(value)
        break
      case "clientDetails":
        this.view.updateClientDetails(value)
        break
      case "invoiceNumber":
        this.view.updateInvoiceNumber(value)
        break
      case "font":
        this.view.updateFont(value)
        break
      case "primaryColor":
      case "secondaryColor":
        this.view.updateColors(this.model.data.primaryColor, this.model.data.secondaryColor)
        break
      case "model":
        this.view.updateModel(value)
        break
      case "items":
        this.updateItemsDisplay()
        break
      case "images":
        Object.keys(value).forEach((imageType) => {
          if (imageType !== "watermarkOpacity") {
            this.view.updateImage(imageType, value[imageType])
          }
        })
        break
      case "activeComponents":
        this.view.updateComponentVisibility(value)
        break
    }
  }

  setupFormListeners() {
    // Text inputs
    const inputs = {
      "company-details": (value) => this.model.setCompanyDetails(value),
      "client-details": (value) => this.model.setClientDetails(value),
      "invoice-number": (value) => this.model.setInvoiceNumber(value),
      "slogan-input": (value) => {
        this.model.data.slogan = value
        this.view.updateSlogan(value)
      },
      "footer-number": (value) => {
        this.model.data.footerNumber = value
        this.view.updateFooterNumber(value)
      },
      "payment-info": (value) => {
        this.model.data.paymentInfo = value
        this.view.updatePaymentInfo(value)
      },
      "tax-rate": (value) => this.model.setTaxRate(value),
    }

    Object.keys(inputs).forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        element.addEventListener("input", (e) => {
          inputs[id](e.target.value)
        })
      }
    })

    // Date inputs
    const dateInputs = ["invoice-date", "due-date"]
    dateInputs.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        element.addEventListener("change", (e) => {
          const property = id.replace("-", "")
          this.model.data[property] = e.target.value
          if (id === "invoice-date") {
            this.view.updateInvoiceDate(e.target.value)
          } else {
            this.view.updateDueDate(e.target.value)
          }
        })
      }
    })

    // Select inputs
    const fontSelect = document.getElementById("font-select")
    if (fontSelect) {
      fontSelect.addEventListener("change", (e) => {
        this.model.setFont(e.target.value)
      })
    }

    // Color inputs
    const primaryColor = document.getElementById("primary-color")
    const secondaryColor = document.getElementById("secondary-color")

    if (primaryColor) {
      primaryColor.addEventListener("input", (e) => {
        this.model.setPrimaryColor(e.target.value)
      })
    }

    if (secondaryColor) {
      secondaryColor.addEventListener("input", (e) => {
        this.model.setSecondaryColor(e.target.value)
      })
    }

    // Model radio buttons
    const modelRadios = document.querySelectorAll('input[name="model"]')
    modelRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.model.setModel(e.target.value)
        }
      })
    })
  }

  setupButtonListeners() {
    const saveBtn = document.getElementById("save-btn")
    const cancelBtn = document.getElementById("cancel-btn")
    const closeBtn = document.getElementById("close-btn")

    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.savePDF())
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.cancel())
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close())
    }
  }

  initializeItemManager() {
    this.itemCounter = 0
  }

  addInvoiceItem() {
    this.itemCounter++

    const template = document.getElementById("invoice-item-template")
    const clone = template.content.cloneNode(true)
    const itemElement = clone.querySelector(".invoice-item")

    // Set item number
    clone.querySelector(".item-number").textContent = this.itemCounter
    itemElement.dataset.itemId = "item-" + this.itemCounter

    // Setup event listeners for the new item
    const inputs = itemElement.querySelectorAll("input")
    inputs.forEach((input) => {
      input.addEventListener("input", () => this.updateItemFromDOM())
    })

    // Setup remove button
    const removeButton = clone.querySelector(".btn-remove-item")
    removeButton.addEventListener("click", (e) => {
      const itemId = e.target.closest(".invoice-item").dataset.itemId
      document.querySelector(`[data-item-id="${itemId}"]`).remove()
      this.updateItemFromDOM()
    })

    // Add to container
    const container = document.getElementById("invoice-items-container")
    container.appendChild(clone)

    // Add to model
    this.model.addItem({
      description: "",
      details: "",
      quantity: 1,
      price: 0,
    })
  }

  updateItemFromDOM() {
    const items = []
    const itemElements = document.querySelectorAll(".invoice-item")

    itemElements.forEach((element) => {
      const item = {
        description: element.querySelector(".item-description").value,
        details: element.querySelector(".item-details").value,
        quantity: Number.parseFloat(element.querySelector(".item-quantity").value) || 0,
        price: Number.parseFloat(element.querySelector(".item-price").value) || 0,
      }
      items.push(new InvoiceItem(item))
    })

    this.model.data.items = items
    this.updateItemsDisplay()
  }

  updateItemsDisplay() {
    const subtotal = this.model.calculateSubtotal()
    const taxAmount = this.model.calculateTax()
    const total = this.model.calculateTotal()

    this.view.updateItems(this.model.data.items, this.model.data.taxRate)
    this.view.updateSummary(subtotal, this.model.data.taxRate, taxAmount, total)
  }

  updatePreview() {
    // Update all preview elements
    this.view.updateCompanyDetails(this.model.data.companyDetails)
    this.view.updateClientDetails(this.model.data.clientDetails)
    this.view.updateInvoiceNumber(this.model.data.invoiceNumber)
    this.view.updateInvoiceDate(this.model.data.invoiceDate)
    this.view.updateDueDate(this.model.data.dueDate)
    this.view.updatePaymentInfo(this.model.data.paymentInfo)
    this.view.updateFooterNumber(this.model.data.footerNumber)
    this.view.updateSlogan(this.model.data.slogan)
    this.updateItemsDisplay()

    // Update component visibility
    this.view.updateComponentVisibility(this.activeComponents)
  }

  addComponent(component) {
    // Add component to the preview using ComponentManager
    this.componentManager.addComponent(component)

    // Show success message
    this.view.showToast(`Composant "${component.name}" ajouté à la facture`)
  }

  onComponentRemoved(componentId) {
    // Handle component removal
    console.log("Component removed:", componentId)
  }

  onComponentUpdated(componentId, data) {
    // Handle component updates
    console.log("Component updated:", componentId, data)

    // Update model data based on component
    this.updateModelFromComponent(componentId, data)
  }

  updateModelFromComponent(componentId, data) {
    switch (componentId) {
      case "company-details":
        this.model.setCompanyDetails(data.text || "")
        break
      case "client-details":
        this.model.setClientDetails(data.text || "")
        break
      case "invoice-number":
        this.model.setInvoiceNumber(data.text || "")
        break
      case "slogan":
        this.model.data.slogan = data.text || ""
        break
      case "footer-number":
        this.model.data.footerNumber = data.text || ""
        break
      case "payment-info":
        this.model.data.paymentInfo = data.text || ""
        break
    }

    // Handle image components
    if (data.image) {
      const imageType = this.getImageTypeFromComponent(componentId)
      if (imageType) {
        this.model.setImage(imageType, data.image)
      }
    }

    // Store component data for PDF generation
    this.storeComponentData(componentId, data)
  }

  storeComponentData(componentId, data) {
    if (!this.model.data.components) {
      this.model.data.components = []
    }

    // Find existing component or create new one
    let component = this.model.data.components.find((comp) => comp.id === componentId)

    if (!component) {
      // Get component definition from library
      const componentDef = this.componentLibrary.getComponent(componentId)

      if (!componentDef) return

      // Create new component data
      component = {
        id: componentId,
        type: componentDef.type,
        position: { x: 50, y: 50 },
        size: { width: 200, height: 60 },
      }

      this.model.data.components.push(component)
    }

    // Update component data based on type
    switch (component.type) {
      case "text":
        component.content = data.text
        break
      case "separator":
        component.thickness = data.thickness
        component.color = data.color
        break
      case "pager":
        component.format = data.format
        break
      case "invoice-data":
        component.content = data.text
        break
      case "invoice-table":
        component.rows = data.rows
        break
      case "invoice-summary":
        component.summary = data.summary
        break
      case "image":
        component.imageData = data.image
        break
    }

    // Update position and size if available from ComponentManager
    const componentData = this.componentManager.activeComponents.get(componentId)
    if (componentData) {
      component.position = componentData.position
      component.size = componentData.size
    }
  }

  getImageTypeFromComponent(componentId) {
    const mapping = {
      logo: "logoImage",
      signature: "signatureImage",
      "header-image": "headerImage",
      "footer-image": "footerImage",
      watermark: "watermarkImage",
    }
    return mapping[componentId]
  }

  async testServerConnection() {
    try {
      console.log("Testing server connection...")
      const response = await fetch("/api/debug", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Server connection test successful:", data)
        return true
      } else {
        console.error("Server connection test failed:", response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error("Server connection test error:", error)
      return false
    }
  }

  async testSimplePDF() {
    try {
      console.log("Testing simple PDF generation...")
      const response = await fetch("/api/test-pdf", {
        method: "GET",
      })

      if (response.ok) {
        const blob = await response.blob()

        // Download the PDF
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = "test-simple.pdf"

        document.body.appendChild(a)
        a.click()

        window.URL.revokeObjectURL(url)
        a.remove()

        this.view.showSuccess("Test PDF généré avec succès!")
        return true
      } else {
        console.error("Simple PDF test failed:", response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error("Simple PDF test error:", error)
      return false
    }
  }

  async savePDF() {
    try {
      console.log("=== Starting PDF Generation ===")

      // Test server connection first
      const serverOk = await this.testServerConnection()
      if (!serverOk) {
        this.view.showError("Connexion au serveur échouée. Vérifiez que le serveur fonctionne.")
        return
      }

      // Prepare data
      const invoiceData = this.model.toJSON()

      // Add components data
      invoiceData.components = []

      // Variables to store invoice and due dates from components
      let invoiceDateFromComponent = ""
      let dueDateFromComponent = ""

      // Get all active components from the component manager
      this.componentManager.activeComponents.forEach((componentData, componentId) => {
        const component = componentData.component
        const position = componentData.position
        const size = componentData.size

        // Create component data for PDF generation
        const componentForPDF = {
          id: componentId,
          type: component.type,
          position: position,
          size: size,
        }

        // Add specific data based on component type
        switch (component.type) {
          case "text":
            componentForPDF.content = componentData.element.querySelector(".component-content").textContent
            break
          case "invoice-data":
            componentForPDF.content = componentData.element.querySelector(".component-content").textContent
            break
          case "invoice-dates":
            const dateContent = componentData.element.querySelector(".component-content")
            const dateTexts = dateContent.innerText.split("\n")
            invoiceDateFromComponent = dateTexts[0].replace("Date de la facture: ", "")
            dueDateFromComponent = dateTexts[1].replace("Date d'échéance: ", "")
            // Also include it in componentForPDF for consistency if needed by backend for individual component rendering
            componentForPDF.dates = {
              invoiceDate: invoiceDateFromComponent,
              dueDate: dueDateFromComponent,
            }
            break
          case "separator":
            const separatorContent = componentData.element.querySelector(".separator-content")
            componentForPDF.thickness = Number.parseInt(separatorContent.style.height) || 2
            componentForPDF.color = separatorContent.style.backgroundColor || "#000000"
            break
          case "pager":
            componentForPDF.format = componentData.element
              .querySelector(".component-content")
              .textContent.replace("1", "{page}")
              .replace("1", "{total}")
            break
          case "invoice-table":
            // Extract table data
            const tableRows = []
            const tableElement = componentData.element.querySelector("table")
            if (tableElement) {
              const rows = tableElement.querySelectorAll("tbody tr")
              rows.forEach((row) => {
                const cells = row.querySelectorAll("td")
                if (cells.length >= 5) {
                  tableRows.push({
                    description: cells[0].textContent,
                    quantity: Number.parseFloat(cells[1].textContent) || 0,
                    unitPrice: Number.parseFloat(cells[2].textContent) || 0,
                    tax: Number.parseFloat(cells[3].textContent) || 0,
                    total: Number.parseFloat(cells[4].textContent) || 0,
                  })
                }
              })
            }
            componentForPDF.rows = tableRows
            break
          case "invoice-summary":
            // Extract summary data
            const summaryRows = componentData.element.querySelectorAll(".invoice-summary-row")
            if (summaryRows.length >= 3) {
              const subtotalText = summaryRows[0].querySelector("span:last-child").textContent
              const taxText = summaryRows[1].querySelector("span:last-child").textContent
              const totalText = summaryRows[2].querySelector("span:last-child").textContent

              const taxRateText = summaryRows[1].querySelector("span:first-child").textContent
              const taxRate = Number.parseFloat(taxRateText.match(/\d+/)[0]) || 20

              componentForPDF.summary = {
                subtotal: Number.parseFloat(subtotalText) || 0,
                taxRate: taxRate,
                taxAmount: Number.parseFloat(taxText) || 0,
                total: Number.parseFloat(totalText) || 0,
              }
            }
            break
          case "image":
            const imgElement = componentData.element.querySelector(".image-placeholder")
            if (imgElement && imgElement.style.backgroundImage) {
              const bgImage = imgElement.style.backgroundImage
              componentForPDF.imageData = bgImage.substring(5, bgImage.length - 2) // Extract URL from url("...")
            }
            break
        }

        invoiceData.components.push(componentForPDF)
      })

      // Assign the extracted dates to the top-level invoiceData object
      invoiceData.invoiceDate = invoiceDateFromComponent
      invoiceData.dueDate = dueDateFromComponent

      console.log("Invoice data to send:", invoiceData)

      console.log("Envoi des données au serveur pour la génération PDF")

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response error:", errorText)

        // Try simple PDF as fallback
        console.log("Trying simple PDF fallback...")
        const fallbackSuccess = await this.testSimplePDF()
        if (!fallbackSuccess) {
          throw new Error(`Server error: ${response.status} - ${errorText}`)
        }
        return
      }

      const blob = await response.blob()
      console.log("PDF blob received, size:", blob.size)

      if (blob.size === 0) {
        throw new Error("PDF blob is empty")
      }

      // Download the PDF
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = "facture-template.pdf"

      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      a.remove()

      this.view.showSuccess("Template sauvegardé avec succès!")
    } catch (error) {
      console.error("Erreur lors de la génération PDF:", error)

      // Show detailed error message
      let errorMessage = "Échec de la génération PDF."
      if (error.message.includes("fetch")) {
        errorMessage += " Problème de connexion au serveur."
      } else if (error.message.includes("JSON")) {
        errorMessage += " Erreur de format de données."
      } else {
        errorMessage += ` Détails: ${error.message}`
      }

      this.view.showError(errorMessage)

      // Offer simple PDF as alternative
      setTimeout(async () => {
        if (confirm("Voulez-vous essayer de générer un PDF simple de test?")) {
          await this.testSimplePDF()
        }
      }, 2000)
    }
  }

  cancel() {
    if (confirm("Êtes-vous sûr de vouloir annuler? Tous les changements seront perdus.")) {
      window.location.reload()
    }
  }

  close() {
    if (confirm("Êtes-vous sûr de vouloir fermer? Tous les changements seront perdus.")) {
      window.location.href = "/dashboard"
    }
  }
}
