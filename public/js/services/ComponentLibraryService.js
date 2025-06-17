export class ComponentLibraryService {
  constructor() {
    this.components = this.initializeComponents()
    this.categories = this.initializeCategories()
    this.demoData = this.initializeDemoData()
  }

  // Update the initializeCategories method to keep only the requested categories
  initializeCategories() {
    return [
      {
        id: "basic",
        name: "Éléments de base",
        icon: "layout-template",
        components: ["text", "image", "separator", "pager"],
      },
      {
        id: "invoice",
        name: "Éléments de facture",
        icon: "file-text",
        components: [
          "client-address",
          "company-address",
          "client-name",
          "company-name",
          "invoice-number",
          "invoice-date",
          "articles-table",
          "amounts-summary",
        ],
      },
    ]
  }

  // Update the initializeComponents method to add the "Num Facture" component
  // and update the invoice-date component
  initializeComponents() {
    const components = {
      // Normal components
      text: {
        id: "text",
        name: "Texte",
        icon: "text",
        type: "text",
        description: "Bloc de texte personnalisable",
        defaultPosition: { x: 50, y: 50 },
      },
      image: {
        id: "image",
        name: "Image",
        icon: "image",
        type: "image",
        description: "Image personnalisable",
        defaultPosition: { x: 50, y: 50, size: 1 },
      },
      separator: {
        id: "separator",
        name: "Séparateur",
        icon: "minus",
        type: "separator",
        description: "Ligne de séparation horizontale",
        defaultPosition: { x: 50, y: 50, width: 500 },
      },
      pager: {
        id: "pager",
        name: "Numérotation de page",
        icon: "file-text",
        type: "pager",
        description: "Numéro de page / Nombre total de pages",
        defaultPosition: { x: 297.5, y: 800 },
      },

      // Invoice-specific components
      "client-address": {
        id: "client-address",
        name: "Adresse client",
        icon: "map-pin",
        type: "invoice-data",
        dataField: "clientDetails",
        description: "Adresse du client (depuis la base de données)",
        defaultPosition: { x: 400, y: 150 },
      },
      "company-address": {
        id: "company-address",
        name: "Adresse entreprise",
        icon: "home",
        type: "invoice-data",
        dataField: "companyDetails",
        description: "Adresse de l'entreprise (depuis la base de données)",
        defaultPosition: { x: 50, y: 150 },
      },
      "client-name": {
        id: "client-name",
        name: "Nom du client",
        icon: "user",
        type: "invoice-data",
        dataField: "clientName",
        description: "Nom du client (depuis la base de données)",
        defaultPosition: { x: 400, y: 100 },
      },
      "company-name": {
        id: "company-name",
        name: "Nom de l'entreprise",
        icon: "briefcase",
        type: "invoice-data",
        dataField: "companyName",
        description: "Nom de l'entreprise (depuis la base de données)",
        defaultPosition: { x: 50, y: 100 },
      },
      "invoice-number": {
        id: "invoice-number",
        name: "Num Facture",
        icon: "hash",
        type: "invoice-data",
        dataField: "invoiceNumber",
        description: "Numéro de facture (depuis la base de données)",
        defaultPosition: { x: 50, y: 100 },
      },
      "invoice-date": {
        id: "invoice-date",
        name: "Dates de facture",
        icon: "calendar",
        type: "invoice-dates",
        dataField: "invoiceDates",
        description: "Dates de la facture (depuis la base de données)",
        defaultPosition: { x: 50, y: 150 },
      },
      "articles-table": {
        id: "articles-table",
        name: "Tableau d'articles",
        icon: "grid",
        type: "invoice-table",
        dataField: "articles",
        description: "Tableau des articles (personnalisable)",
        defaultPosition: { x: 50, y: 250 },
      },
      "amounts-summary": {
        id: "amounts-summary",
        name: "Résumé des montants",
        icon: "dollar-sign",
        type: "invoice-summary",
        dataField: "amounts",
        description: "Résumé des montants (personnalisable)",
        defaultPosition: { x: 400, y: 500 },
      },
    }

    return components
  }

  // Update the initializeDemoData method to include the invoice number and dates
  initializeDemoData() {
    return {
      clientName: "Entreprise ABC",
      clientAddress: "123 Rue du Client\n75001 Paris\nFrance",
      companyName: "Ma Société SARL",
      companyAddress: "456 Avenue de l'Entreprise\n69001 Lyon\nFrance",
      invoiceNumber: "INV/2020/07/0003",
      invoiceDates: {
        invoiceDate: "07/06/2020",
        dueDate: "08/07/2020",
      },
      articles: [
        { description: "Développement site web", quantity: 1, unitPrice: 1200, tax: 20, total: 1200 },
        { description: "Hébergement annuel", quantity: 12, unitPrice: 25, tax: 20, total: 300 },
        { description: "Maintenance", quantity: 5, unitPrice: 75, tax: 20, total: 375 },
      ],
      amounts: {
        subtotal: 1875,
        tax: 375,
        total: 2250,
      },
    }
  }

  getCategories() {
    return this.categories
  }

  getComponentsByCategory(categoryId) {
    const category = this.categories.find((cat) => cat.id === categoryId)
    if (!category) return []

    return category.components.map((compId) => this.components[compId])
  }

  getComponent(componentId) {
    return this.components[componentId]
  }

  getAllComponents() {
    return Object.values(this.components)
  }

  getDemoData(dataField) {
    return this.demoData[dataField] || null
  }
}
