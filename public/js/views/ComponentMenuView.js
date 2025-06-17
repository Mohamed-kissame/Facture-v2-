export class ComponentMenuView {
  constructor(componentLibrary, invoiceController) {
    this.componentLibrary = componentLibrary
    this.invoiceController = invoiceController
    this.activeCategory = null
    this.menuContainer = null
    this.componentListContainer = null
  }

  initialize() {
    this.createMenuStructure()
    this.renderCategories()
    this.setActiveCategory(this.componentLibrary.getCategories()[0].id)
  }

  createMenuStructure() {
    // Find the component menu container
    this.menuContainer = document.getElementById("component-menu-container")

    // Create component menu structure
    const menuContent = document.createElement("div")
    menuContent.className = "component-menu"

    // Create category tabs
    const categoryTabs = document.createElement("div")
    categoryTabs.className = "component-categories"

    // Create component list container
    this.componentListContainer = document.createElement("div")
    this.componentListContainer.className = "component-list"

    // Append to menu container
    menuContent.appendChild(categoryTabs)
    menuContent.appendChild(this.componentListContainer)
    this.menuContainer.appendChild(menuContent)

    // Add styles
    this.addStyles()
  }

  addStyles() {
    // Check if styles already exist
    if (document.getElementById("component-menu-styles")) return

    const styleEl = document.createElement("style")
    styleEl.id = "component-menu-styles"
    styleEl.textContent = `
      .main-header {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .main-header h2 {
        margin: 0;
        color: var(--text-color);
        font-size: 18px;
        font-weight: 600;
      }
      
      .component-menu {
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
        background: #f8fafc;
      }
      
      .component-categories {
        display: flex;
        background-color: #f1f5f9;
        border-bottom: 1px solid var(--border-color);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      .component-categories::-webkit-scrollbar {
        display: none;
      }
      
      .category-tab {
        padding: 12px 16px;
        cursor: pointer;
        white-space: nowrap;
        border-bottom: 3px solid transparent;
        color: var(--text-muted);
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s ease;
        min-width: fit-content;
        text-align: center;
      }
      
      .category-tab:hover {
        background-color: rgba(37, 99, 235, 0.05);
        color: var(--primary-color);
      }
      
      .category-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        background-color: rgba(37, 99, 235, 0.08);
        font-weight: 600;
      }
      
      .component-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 16px;
        background: white;
      }
      
      .component-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;
        border: 1px solid transparent;
        background: #fafafa;
      }
      
      .component-item:hover {
        background-color: rgba(37, 99, 235, 0.05);
        border-color: rgba(37, 99, 235, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .component-item-icon {
        width: 32px;
        height: 32px;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);
        font-size: 18px;
        background: rgba(37, 99, 235, 0.1);
        border-radius: 6px;
      }
      
      .component-item-content {
        flex: 1;
      }
      
      .component-item-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-color);
        font-size: 14px;
      }
      
      .component-item-description {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.4;
      }
      
      .component-item-add {
        opacity: 0;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background-color: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-weight: bold;
        font-size: 16px;
      }
      
      .component-item:hover .component-item-add {
        opacity: 1;
      }
      
      .component-item-add:hover {
        background-color: #1d4ed8;
        transform: scale(1.1);
      }
      
      .add-item-section {
        margin: 20px 0;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid var(--border-color);
      }
      
      .hidden-config {
        display: none;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .component-categories {
          flex-wrap: wrap;
        }
        
        .category-tab {
          flex: 1;
          min-width: 80px;
        }
        
        .component-item {
          padding: 10px 12px;
        }
        
        .component-item-icon {
          width: 28px;
          height: 28px;
          font-size: 16px;
        }
      }
    `

    document.head.appendChild(styleEl)
  }

  renderCategories() {
    const categoryTabs = this.menuContainer.querySelector(".component-categories")
    categoryTabs.innerHTML = ""

    this.componentLibrary.getCategories().forEach((category) => {
      const tab = document.createElement("div")
      tab.className = "category-tab"
      tab.dataset.categoryId = category.id
      tab.textContent = category.name

      tab.addEventListener("click", () => {
        this.setActiveCategory(category.id)
      })

      categoryTabs.appendChild(tab)
    })
  }

  setActiveCategory(categoryId) {
    this.activeCategory = categoryId

    // Update active tab
    const tabs = this.menuContainer.querySelectorAll(".category-tab")
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.categoryId === categoryId)
    })

    // Render components for this category
    this.renderComponents(categoryId)
  }

  renderComponents(categoryId) {
    const components = this.componentLibrary.getComponentsByCategory(categoryId)
    this.componentListContainer.innerHTML = ""

    if (components.length === 0) {
      this.componentListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p>Aucun composant disponible dans cette catégorie</p>
        </div>
      `
      return
    }

    components.forEach((component) => {
      const item = document.createElement("div")
      item.className = "component-item"
      item.dataset.componentId = component.id

      item.innerHTML = `
        <div class="component-item-icon">
          <i class="icon-${component.icon}"></i>
        </div>
        <div class="component-item-content">
          <div class="component-item-title">${component.name}</div>
        </div>
        <div class="component-item-add">+</div>
      `

      item.addEventListener("click", () => {
        this.addComponentToInvoice(component.id)
      })

      this.componentListContainer.appendChild(item)
    })
  }

  addComponentToInvoice(componentId) {
    const component = this.componentLibrary.getComponent(componentId)
    if (!component) return

    // Add component to invoice
    this.invoiceController.addComponent(component)

    // Show visual feedback
    this.showComponentAdded(componentId)
  }

  showComponentAdded(componentId) {
    const componentItem = this.componentListContainer.querySelector(`[data-component-id="${componentId}"]`)
    if (componentItem) {
      // Add temporary success styling
      componentItem.style.background = "rgba(16, 185, 129, 0.1)"
      componentItem.style.borderColor = "rgba(16, 185, 129, 0.3)"

      // Reset after animation
      setTimeout(() => {
        componentItem.style.background = ""
        componentItem.style.borderColor = ""
      }, 1000)
    }
  }
}
