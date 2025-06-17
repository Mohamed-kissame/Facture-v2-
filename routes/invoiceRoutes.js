import express from "express"
import { InvoiceController } from "../controllers/InvoiceController.js"

const router = express.Router()
const invoiceController = new InvoiceController()

// Bind methods to maintain 'this' context
router.post("/generate-pdf", invoiceController.generatePDF.bind(invoiceController))
router.post("/process-image", invoiceController.processImage.bind(invoiceController))
router.post("/test-image-embed", invoiceController.testImageEmbed.bind(invoiceController))
router.post("/debug-images", invoiceController.debugImages.bind(invoiceController))

// Test and debug routes
router.get("/test-pdf", invoiceController.testPDF.bind(invoiceController))
router.all("/debug", invoiceController.debugServer.bind(invoiceController))

export default router
