import { InvoiceController } from "./controllers/InvoiceController.js"

// Main application entry point
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initialisation de l'application de configuration de facture avec architecture OOP")

  try {
    // Initialize the application with OOP structure
    const app = new InvoiceController()

    // Make it globally available for debugging
    window.invoiceApp = app

    console.log("Application initialisée avec succès")
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'application:", error)
  }
})
