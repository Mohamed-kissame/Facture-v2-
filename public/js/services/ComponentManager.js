export class ComponentManager {
  constructor(invoiceController) {
    this.invoiceController = invoiceController
    this.componentLibrary = invoiceController.componentLibrary
    this.activeComponents = new Map()
    this.componentContainer = document.getElementById("invoice-components")
    this.emptyState = document.getElementById("empty-state")
    this.invoicePreview = document.getElementById("invoice-preview")
    this.selectedComponent = null

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Listen for clicks outside components to deselect
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".invoice-component")) {
        this.deselectComponent()
      }
    })
  }

  addComponent(component) {
    // Hide empty state
    this.emptyState.style.display = "none"
    // Remove 'empty' class from invoice-preview to disable its flex centering
    if (this.invoicePreview) {
      this.invoicePreview.classList.remove("empty")
    }

    // Create component element
    const componentElement = this.createComponentElement(component)

    // Add to container
    this.componentContainer.appendChild(componentElement)

    // Store reference with default size
    this.activeComponents.set(component.id, {
      component: component,
      element: componentElement,
      position: { x: 50, y: 50 + this.activeComponents.size * 60 },
      size: { width: 200, height: 60 }, // Default size
    })

    // Make it draggable and resizable
    this.makeDraggable(componentElement, component.id)
    this.makeResizable(componentElement, component.id)

    // Apply initial size
    this.updateComponentSize(component.id, 200, 60)

    // Show edit dialog for text components
    if (component.type === "text") {
      this.showEditDialog(component.id)
    } else if (component.type === "image") {
      this.triggerImageUpload(component.id)
    } else if (
      component.type === "invoice-data" ||
      component.type === "invoice-table" ||
      component.type === "invoice-summary"
    ) {
      // For invoice data components, load demo data
      this.loadDemoData(component.id)
    }

    return componentElement
  }

  createComponentElement(component) {
    const element = document.createElement("div")
    element.className = "invoice-component"
    element.dataset.componentId = component.id
    element.dataset.componentType = component.type

    // Add component content based on type
    let content = ""
    switch (component.type) {
      case "text":
        content = `<div class="component-content text-content">${component.name}</div>`
        break
      case "image":
        content = `<div class="component-content image-content">
          <div class="image-placeholder">📷 ${component.name}</div>
        </div>`
        break
      case "separator":
        content = `<div class="component-content separator-content"></div>`
        break
      case "pager":
        content = `<div class="component-content pager-content">Page 1 sur 1</div>`
        break
      case "invoice-data":
        content = `<div class="component-content invoice-data-content">${component.name}</div>`
        break
      case "invoice-dates":
        content = `<div class="component-content invoice-dates-content">
        <div>Date de la facture: </div>
        <div>Date d'échéance: </div>
      </div>`
        break
      case "invoice-table":
        content = `<div class="component-content invoice-table-content">
        <table>
          <thead><tr><th>Description</th><th>Quantité</th><th>Prix unitaire</th><th>TVA (%)</th><th>Total</th></tr></thead>
          <tbody><tr><td colspan="5">Tableau des articles</td></tr></tbody>
        </table>
      </div>`
        break
      case "invoice-summary":
        content = `<div class="component-content invoice-summary-content">
        <div class="invoice-summary-row"><span>Sous-total:</span><span>0.00 €</span></div>
        <div class="invoice-summary-row"><span>TVA (20%):</span><span>0.00 €</span></div>
        <div class="invoice-summary-row"><span>Total:</span><span>0.00 €</span></div>
      </div>`
        break
      case "table":
        content = `<div class="component-content table-content">
        <table class="mini-table">
          <thead><tr><th>Description</th><th>Quantité</th><th>Prix</th></tr></thead>
          <tbody><tr><td colspan="3">Tableau des articles</td></tr></tbody>
        </table>
      </div>`
        break
      case "calculation":
        content = `<div class="component-content calculation-content">${component.name}: $0.00</div>`
        break
      default:
        content = `<div class="component-content">${component.name}</div>`
    }

    element.innerHTML = `
    ${content}
    <div class="resize-handles">
      <div class="resize-handle resize-se"></div>
      <div class="resize-handle resize-sw"></div>
      <div class="resize-handle resize-ne"></div>
      <div class="resize-handle resize-nw"></div>
      <div class="resize-handle resize-n"></div>
      <div class="resize-handle resize-s"></div>
      <div class="resize-handle resize-e"></div>
      <div class="resize-handle resize-w"></div>
    </div>
  `

    // Add event listeners
    element.addEventListener("click", (e) => {
      e.stopPropagation()
      this.selectComponent(component.id)
    })

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault() // Prevent default right-click menu
      this.selectComponent(component.id) // Select component on right-click
      this.showContextMenu(component.id, e.clientX, e.clientY) // Show custom context menu
    })

    return element
  }

  makeResizable(element, componentId) {
    const handles = element.querySelectorAll(".resize-handle")

    handles.forEach((handle) => {
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        e.preventDefault()

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = Number.parseInt(window.getComputedStyle(element).width, 10)
        const startHeight = Number.parseInt(window.getComputedStyle(element).height, 10)
        const startLeft = Number.parseInt(window.getComputedStyle(element).left, 10)
        const startTop = Number.parseInt(window.getComputedStyle(element).top, 10)

        const handleClass = handle.className.split(" ")[1] // Get resize direction

        const onMouseMove = (e) => {
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY

          let newWidth = startWidth
          let newHeight = startHeight
          let newLeft = startLeft
          let newTop = startTop

          // Handle different resize directions
          if (handleClass.includes("e")) {
            newWidth = Math.max(50, startWidth + deltaX)
          }
          if (handleClass.includes("w")) {
            newWidth = Math.max(50, startWidth - deltaX)
            newLeft = startLeft + deltaX
          }
          if (handleClass.includes("s")) {
            newHeight = Math.max(30, startHeight + deltaY)
          }
          if (handleClass.includes("n")) {
            newHeight = Math.max(30, startHeight - deltaY)
            newTop = startTop + deltaY
          }

          // Apply new dimensions
          element.style.width = newWidth + "px"
          element.style.height = newHeight + "px"
          element.style.left = newLeft + "px"
          element.style.top = newTop + "px"
        }

        const onMouseUp = () => {
          // Update stored size
          const componentData = this.activeComponents.get(componentId)
          if (componentData) {
            componentData.size = {
              width: Number.parseInt(element.style.width),
              height: Number.parseInt(element.style.height),
            }
            componentData.position = {
              x: Number.parseInt(element.style.left),
              y: Number.parseInt(element.style.top),
            }
          }

          document.removeEventListener("mousemove", onMouseMove)
          document.removeEventListener("mouseup", onMouseUp)
        }

        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
      })
    })
  }

  makeDraggable(element, componentId) {
    let isDragging = false
    let startX, startY, startLeft, startTop

    element.addEventListener("mousedown", (e) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY

      const rect = element.getBoundingClientRect()
      const containerRect = this.componentContainer.getBoundingClientRect()

      startLeft = rect.left - containerRect.left
      startTop = rect.top - containerRect.top

      element.style.position = "absolute"
      element.style.left = startLeft + "px"
      element.style.top = startTop + "px"
      element.style.zIndex = "1000"

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)

      e.preventDefault()
    })

    const onMouseMove = (e) => {
      if (!isDragging) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const newLeft = startLeft + deltaX
      const newTop = startTop + deltaY

      element.style.left = Math.max(0, newLeft) + "px"
      element.style.top = Math.max(0, newTop) + "px"
    }

    const onMouseUp = () => {
      isDragging = false
      element.style.zIndex = ""

      // Update position in storage
      const componentData = this.activeComponents.get(componentId)
      if (componentData) {
        componentData.position = {
          x: Number.parseInt(element.style.left),
          y: Number.parseInt(element.style.top),
        }
      }

      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }

  updateComponentSize(componentId, width, height) {
    const componentData = this.activeComponents.get(componentId)
    if (componentData) {
      componentData.element.style.width = width + "px"
      componentData.element.style.height = height + "px"
      componentData.size = { width, height }
    }
  }

  selectComponent(componentId) {
    // Deselect previous
    this.deselectComponent()

    // Select new
    const componentData = this.activeComponents.get(componentId)
    if (componentData) {
      componentData.element.classList.add("selected")
      this.selectedComponent = componentId
    }
  }

  deselectComponent() {
    if (this.selectedComponent) {
      const componentData = this.activeComponents.get(this.selectedComponent)
      if (componentData) {
        componentData.element.classList.remove("selected")
      }
      this.selectedComponent = null
    }
  }

  removeComponent(componentId) {
    const componentData = this.activeComponents.get(componentId)
    if (componentData) {
      // Remove from DOM
      componentData.element.remove()

      // Remove from storage
      this.activeComponents.delete(componentId)

      // Show empty state if no components left
      if (this.activeComponents.size === 0) {
        this.emptyState.style.display = "flex"
      }

      // Notify controller
      this.invoiceController.onComponentRemoved(componentId)
    }
  }

  showSizeDialog(componentId) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const currentSize = componentData.size

    // Create modal dialog
    const modal = document.createElement("div")
    modal.className = "edit-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Taille du composant</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="size-controls">
            <div class="form-group">
              <label>Largeur (px):</label>
              <input type="number" id="component-width" value="${currentSize.width}" min="50" max="800">
            </div>
            <div class="form-group">
              <label>Hauteur (px):</label>
              <input type="number" id="component-height" value="${currentSize.height}" min="30" max="600">
            </div>
            <div class="size-presets">
              <h4>Tailles prédéfinies:</h4>
              <div class="preset-buttons">
                <button class="preset-btn" data-width="150" data-height="50">Petit</button>
                <button class="preset-btn" data-width="250" data-height="80">Moyen</button>
                <button class="preset-btn" data-width="350" data-height="120">Grand</button>
                <button class="preset-btn" data-width="500" data-height="150">Très grand</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary save-size-btn">Appliquer</button>
          <button class="btn btn-secondary cancel-btn">Annuler</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Add event listeners for presets
    modal.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const width = btn.dataset.width
        const height = btn.dataset.height
        modal.querySelector("#component-width").value = width
        modal.querySelector("#component-height").value = height
      })
    })

    // Add event listeners
    modal.querySelector(".modal-close").addEventListener("click", () => {
      modal.remove()
    })

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      modal.remove()
    })

    modal.querySelector(".save-size-btn").addEventListener("click", () => {
      const width = Number.parseInt(modal.querySelector("#component-width").value)
      const height = Number.parseInt(modal.querySelector("#component-height").value)

      if (width >= 50 && height >= 30) {
        this.updateComponentSize(componentId, width, height)
        modal.remove()
      } else {
        alert("Largeur minimum: 50px, Hauteur minimum: 30px")
      }
    })

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  showEditDialog(componentId) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const component = componentData.component

    // Create modal dialog
    const modal = document.createElement("div")
    modal.className = "edit-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Modifier ${component.name}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${this.getEditForm(component)}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary save-btn">Sauvegarder</button>
          <button class="btn btn-secondary cancel-btn">Annuler</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Add event listeners
    modal.querySelector(".modal-close").addEventListener("click", () => {
      modal.remove()
    })

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      modal.remove()
    })

    modal.querySelector(".save-btn").addEventListener("click", () => {
      this.saveComponentData(componentId, modal)
      modal.remove()
    })

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })

    // Initialize table editor if needed
    if (component.type === "invoice-table") {
      this.initializeTableEditor(modal, componentId)
    }

    // Initialize summary editor if needed
    if (component.type === "invoice-summary") {
      this.initializeSummaryEditor(modal, componentId)
    }
  }

  getEditForm(component) {
    switch (component.type) {
      case "text":
        return `<textarea id="edit-text" placeholder="Entrez le texte"></textarea>`
      case "separator":
        return `
          <div class="form-group">
            <label>Épaisseur (px):</label>
            <input type="number" id="edit-thickness" min="1" max="10" value="2">
          </div>
          <div class="form-group">
            <label>Couleur:</label>
            <input type="color" id="edit-color" value="#000000">
          </div>
        `
      case "pager":
        return `
          <div class="form-group">
            <label>Format:</label>
            <select id="edit-format">
              <option value="Page {page} sur {total}">Page {page} sur {total}</option>
              <option value="{page}/{total}">Page {page}/{total}</option>
              <option value="Page {page}">Page {page} uniquement</option>
            </select>
          </div>
        `
      case "invoice-dates":
        return `
        <div class="form-group">
          <label>Date de la facture:</label>
          <input type="text" id="edit-invoice-date" placeholder="JJ/MM/AAAA">
        </div>
        <div class="form-group">
          <label>Date d'échéance:</label>
          <input type="text" id="edit-due-date" placeholder="JJ/MM/AAAA">
        </div>
      `
      case "invoice-table":
        return `
          <div class="table-editor">
            <table id="articles-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>TVA (%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <!-- Rows will be added dynamically -->
              </tbody>
            </table>
            <div class="actions">
              <button class="btn btn-primary btn-add-row">Ajouter une ligne</button>
            </div>
          </div>
        `
      case "invoice-summary":
        return `
          <div class="summary-editor">
            <div class="summary-row">
              <label>Sous-total:</label>
              <input type="number" id="edit-subtotal" value="0.00" step="0.01">
            </div>
            <div class="summary-row">
              <label>TVA (%):</label>
              <input type="number" id="edit-tax-rate" value="20" min="0" max="100">
            </div>
            <div class="summary-row">
              <label>Montant TVA:</label>
              <input type="number" id="edit-tax-amount" value="0.00" step="0.01">
            </div>
            <div class="summary-row">
              <label>Total:</label>
              <input type="number" id="edit-total" value="0.00" step="0.01">
            </div>
          </div>
        `
      case "company-details":
        return `<textarea id="edit-company-details" placeholder="Nom de l'entreprise, adresse, etc."></textarea>`
      case "client-details":
        return `<textarea id="edit-client-details" placeholder="Nom du client, adresse, etc."></textarea>`
      case "invoice-number":
        return `<input type="text" id="edit-invoice-number" placeholder="INV-001">`
      case "slogan":
        return `<input type="text" id="edit-slogan" placeholder="Votre slogan ici">`
      case "footer-number":
        return `<input type="text" id="edit-footer-number" placeholder="Numéro de téléphone, etc.">`
      case "payment-info":
        return `<textarea id="edit-payment-info" placeholder="Détails du compte bancaire, etc."></textarea>`
      default:
        return `<input type="text" id="edit-text" placeholder="Entrez le texte">`
    }
  }

  initializeTableEditor(modal, componentId) {
    const tableBody = modal.querySelector("#articles-table tbody")
    const addRowBtn = modal.querySelector(".btn-add-row")
    const componentData = this.activeComponents.get(componentId)

    // Clear existing rows
    tableBody.innerHTML = ""

    // Add demo data rows
    const demoArticles = this.componentLibrary.getDemoData("articles") || []

    if (demoArticles.length === 0) {
      this.addTableRow(tableBody)
    } else {
      demoArticles.forEach((article) => {
        this.addTableRow(tableBody, article)
      })
    }

    // Add row button
    addRowBtn.addEventListener("click", () => {
      this.addTableRow(tableBody)
    })
  }

  addTableRow(tableBody, data = null) {
    const row = document.createElement("tr")

    const description = data ? data.description : ""
    const quantity = data ? data.quantity : 1
    const unitPrice = data ? data.unitPrice : 0
    const tax = data ? data.tax : 20
    const total = data ? data.total : 0

    row.innerHTML = `
      <td><input type="text" class="row-description" value="${description}"></td>
      <td><input type="number" class="row-quantity" value="${quantity}" min="0" step="0.01"></td>
      <td><input type="number" class="row-price" value="${unitPrice}" min="0" step="0.01"></td>
      <td><input type="number" class="row-tax" value="${tax}" min="0" max="100"></td>
      <td><input type="number" class="row-total" value="${total}" readonly></td>
    `

    // Add delete button
    const deleteCell = document.createElement("td")
    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "×"
    deleteBtn.className = "btn-delete-row"
    deleteBtn.addEventListener("click", () => {
      row.remove()
    })
    deleteCell.appendChild(deleteBtn)
    row.appendChild(deleteCell)

    // Add calculation logic
    const quantityInput = row.querySelector(".row-quantity")
    const priceInput = row.querySelector(".row-price")
    const totalInput = row.querySelector(".row-total")

    const calculateTotal = () => {
      const quantity = Number.parseFloat(quantityInput.value) || 0
      const price = Number.parseFloat(priceInput.value) || 0
      const total = quantity * price
      totalInput.value = total.toFixed(2)
    }

    quantityInput.addEventListener("input", calculateTotal)
    priceInput.addEventListener("input", calculateTotal)

    // Calculate initial total
    calculateTotal()

    tableBody.appendChild(row)
  }

  initializeSummaryEditor(modal, componentId) {
    const subtotalInput = modal.querySelector("#edit-subtotal")
    const taxRateInput = modal.querySelector("#edit-tax-rate")
    const taxAmountInput = modal.querySelector("#edit-tax-amount")
    const totalInput = modal.querySelector("#edit-total")

    // Get demo data
    const demoAmounts = this.componentLibrary.getDemoData("amounts") || { subtotal: 0, tax: 0, total: 0 }

    // Set initial values
    subtotalInput.value = demoAmounts.subtotal.toFixed(2)
    taxAmountInput.value = demoAmounts.tax.toFixed(2)
    totalInput.value = demoAmounts.total.toFixed(2)

    // Calculate tax and total when subtotal or tax rate changes
    const calculateAmounts = () => {
      const subtotal = Number.parseFloat(subtotalInput.value) || 0
      const taxRate = Number.parseFloat(taxRateInput.value) || 0

      const taxAmount = subtotal * (taxRate / 100)
      const total = subtotal + taxAmount

      taxAmountInput.value = taxAmount.toFixed(2)
      totalInput.value = total.toFixed(2)
    }

    subtotalInput.addEventListener("input", calculateAmounts)
    taxRateInput.addEventListener("input", calculateAmounts)
  }

  saveComponentData(componentId, modal) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const component = componentData.component

    // Get form data
    const formData = this.getFormData(component.type, modal)

    // Update component content
    this.updateComponentContent(componentId, formData)

    // Notify controller
    this.invoiceController.onComponentUpdated(componentId, formData)
  }

  getFormData(componentType, modal) {
    const data = {}

    switch (componentType) {
      case "text":
        data.text = modal.querySelector("#edit-text")?.value || ""
        break
      case "separator":
        data.thickness = modal.querySelector("#edit-thickness")?.value || 2
        data.color = modal.querySelector("#edit-color")?.value || "#000000"
        break
      case "pager":
        data.format = modal.querySelector("#edit-format")?.value || "Page {page} sur {total}"
        break
      case "invoice-dates":
        data.dates = {
          invoiceDate: modal.querySelector("#edit-invoice-date")?.value || "",
          dueDate: modal.querySelector("#edit-due-date")?.value || "",
        }
        break
      case "invoice-table":
        data.rows = this.getTableData(modal)
        break
      case "invoice-summary":
        data.summary = this.getSummaryData(modal)
        break
      case "company-details":
        data.text = modal.querySelector("#edit-company-details").value
        break
      case "client-details":
        data.text = modal.querySelector("#edit-client-details").value
        break
      case "invoice-number":
        data.text = modal.querySelector("#edit-invoice-number").value
        break
      case "slogan":
        data.text = modal.querySelector("#edit-slogan").value
        break
      case "footer-number":
        data.text = modal.querySelector("#edit-footer-number").value
        break
      case "payment-info":
        data.text = modal.querySelector("#edit-payment-info").value
        break
    }

    return data
  }

  getTableData(modal) {
    const rows = []
    const tableRows = modal.querySelectorAll("#articles-table tbody tr")

    tableRows.forEach((row) => {
      const description = row.querySelector(".row-description").value
      const quantity = Number.parseFloat(row.querySelector(".row-quantity").value) || 0
      const unitPrice = Number.parseFloat(row.querySelector(".row-price").value) || 0
      const tax = Number.parseFloat(row.querySelector(".row-tax").value) || 0
      const total = Number.parseFloat(row.querySelector(".row-total").value) || 0

      rows.push({
        description,
        quantity,
        unitPrice,
        tax,
        total,
      })
    })

    return rows
  }

  getSummaryData(modal) {
    return {
      subtotal: Number.parseFloat(modal.querySelector("#edit-subtotal").value) || 0,
      taxRate: Number.parseFloat(modal.querySelector("#edit-tax-rate").value) || 0,
      taxAmount: Number.parseFloat(modal.querySelector("#edit-tax-amount").value) || 0,
      total: Number.parseFloat(modal.querySelector("#edit-total").value) || 0,
    }
  }

  updateComponentContent(componentId, data) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const component = componentData.component
    const contentElement = componentData.element.querySelector(".component-content")

    if (!contentElement) return

    switch (component.type) {
      case "text":
        if (data.text) {
          contentElement.textContent = data.text
        }
        break
      case "separator":
        contentElement.style.height = `${data.thickness}px`
        contentElement.style.backgroundColor = data.color
        break
      case "pager":
        contentElement.textContent = data.format.replace("{page}", "1").replace("{total}", "1")
        break
      case "invoice-dates":
        if (data.dates) {
          contentElement.innerHTML = `
          <div>Date de la facture: ${data.dates.invoiceDate}</div>
          <div>Date d'échéance: ${data.dates.dueDate}</div>
        `
        }
        break
      case "invoice-table":
        if (data.rows && data.rows.length > 0) {
          let tableHtml = `
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>TVA</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
        `

          data.rows.forEach((row) => {
            tableHtml += `
            <tr>
              <td>${row.description}</td>
              <td>${row.quantity}</td>
              <td>${row.unitPrice.toFixed(2)} €</td>
              <td>${row.tax}%</td>
              <td>${row.total.toFixed(2)} €</td>
            </tr>
          `
          })

          tableHtml += `
            </tbody>
          </table>
        `

          contentElement.innerHTML = tableHtml
        }
        break
      case "invoice-summary":
        if (data.summary) {
          contentElement.innerHTML = `
          <div class="invoice-summary-row"><span>Sous-total:</span><span>${data.summary.subtotal.toFixed(2)} €</span></div>
          <div class="invoice-summary-row"><span>TVA (${data.summary.taxRate}%):</span><span>${data.summary.taxAmount.toFixed(2)} €</span></div>
          <div class="invoice-summary-row"><span>Total:</span><span>${data.summary.total.toFixed(2)} €</span></div>
        `
        }
        break
      case "invoice-data":
        contentElement.textContent = data.text
        break
    }
  }

  loadDemoData(componentId) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const component = componentData.component
    const contentElement = componentData.element.querySelector(".component-content")

    if (!contentElement || !component.dataField) return

    // Get demo data for this component
    const demoData = this.componentLibrary.getDemoData(component.dataField)

    if (!demoData) return

    // Update content based on component type
    switch (component.type) {
      case "invoice-data":
        contentElement.textContent = demoData
        break
      case "invoice-dates":
        if (demoData) {
          contentElement.innerHTML = `
          <div>Date de la facture: ${demoData.invoiceDate}</div>
          <div>Date d'échéance: ${demoData.dueDate}</div>
        `
        }
        break
      case "invoice-table":
        if (Array.isArray(demoData) && demoData.length > 0) {
          let tableHtml = `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>TVA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
          `

          demoData.forEach((item) => {
            tableHtml += `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)} €</td>
                <td>${item.tax}%</td>
                <td>${item.total.toFixed(2)} €</td>
              </tr>
            `
          })

          tableHtml += `
              </tbody>
            </table>
          `

          contentElement.innerHTML = tableHtml
        }
        break
      case "invoice-summary":
        if (demoData) {
          contentElement.innerHTML = `
            <div class="invoice-summary-row"><span>Sous-total:</span><span>${demoData.subtotal.toFixed(2)} €</span></div>
            <div class="invoice-summary-row"><span>TVA (20%):</span><span>${demoData.tax.toFixed(2)} €</span></div>
            <div class="invoice-summary-row"><span>Total:</span><span>${demoData.total.toFixed(2)} €</span></div>
          `
        }
        break
    }
  }

  triggerImageUpload(componentId) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.updateComponentImage(componentId, e.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  updateComponentImage(componentId, imageData) {
    const componentData = this.activeComponents.get(componentId)
    if (!componentData) return

    const imageElement = componentData.element.querySelector(".image-placeholder")
    if (imageElement) {
      imageElement.style.backgroundImage = `url(${imageData})`
      imageElement.style.backgroundSize = "cover"
      imageElement.style.backgroundPosition = "center"
      imageElement.textContent = ""
    }

    // Notify controller
    this.invoiceController.onComponentUpdated(componentId, { image: imageData })
  }

  getActiveComponents() {
    return Array.from(this.activeComponents.keys())
  }

  hasComponents() {
    return this.activeComponents.size > 0
  }

  // New method to show the context menu
  showContextMenu(componentId, x, y) {
    // Remove any existing context menu
    this.removeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    menu.innerHTML = `
      <ul>
        <li data-action="edit">Modifier</li>
        <li data-action="size">Taille</li>
        <li data-action="delete">Supprimer</li>
      </ul>
    `;

    document.body.appendChild(menu);

    // Add event listeners for menu items
    menu.querySelectorAll("li").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent component click event
        const action = item.dataset.action;
        this.handleContextMenuAction(componentId, action);
        this.removeContextMenu(); // Close menu after action
      });
    });

    // Close menu on any outside click
    document.addEventListener("click", this.outsideClickListener = (e) => {
      if (!menu.contains(e.target)) {
        this.removeContextMenu();
      }
    });

    this.activeContextMenu = menu;
  }

  // Helper to handle context menu actions
  handleContextMenuAction(componentId, action) {
    switch (action) {
      case "edit":
        this.showEditDialog(componentId);
        break;
      case "size":
        this.showSizeDialog(componentId);
        break;
      case "delete":
        this.removeComponent(componentId);
        break;
    }
  }

  // Helper to remove the context menu
  removeContextMenu() {
    if (this.activeContextMenu) {
      this.activeContextMenu.remove();
      document.removeEventListener("click", this.outsideClickListener);
      this.activeContextMenu = null;
      this.outsideClickListener = null;
    }
  }
}
