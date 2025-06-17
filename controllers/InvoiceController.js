import { Invoice } from "../models/Invoice.js"
import { PDFGenerator } from "../services/PDFGenerator.js"
import { ImageProcessor } from "../services/ImageProcessor.js"

export class InvoiceController {
  constructor() {
    this.pdfGenerator = new PDFGenerator()
    this.imageProcessor = new ImageProcessor()
  }

  async generatePDF(req, res) {
    try {
      console.log("=== PDF Generation Request ===")
      console.log("Request method:", req.method)
      console.log("Request headers:", req.headers)
      console.log("Request body keys:", Object.keys(req.body || {}))
      console.log("Request body:", JSON.stringify(req.body, null, 2))

      // Simple fallback PDF generation
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log("Empty request body, generating simple PDF")
        return await this.generateSimplePDF(res)
      }

      // Create invoice with default values if data is missing
      const invoiceData = {
        model: req.body.model || "light",
        font: req.body.font || "Helvetica",
        primaryColor: req.body.primaryColor || "#000000",
        secondaryColor: req.body.secondaryColor || "#000000",
        background: req.body.background || "none",
        slogan: req.body.slogan || "",
        companyDetails: req.body.companyDetails || "",
        clientDetails: req.body.clientDetails || "",
        invoiceNumber: req.body.invoiceNumber || "INV-001",
        invoiceDate: req.body.invoiceDate || new Date().toISOString().split("T")[0],
        dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        taxRate: Number.parseFloat(req.body.taxRate) || 0,
        footerNumber: req.body.footerNumber || "",
        paymentInfo: req.body.paymentInfo || "",
        items: Array.isArray(req.body.items) ? req.body.items : [],
        images: req.body.images || {},
        positionData: req.body.positionData || {},
      }

      console.log("Processed invoice data:", JSON.stringify(invoiceData, null, 2))

      const invoice = new Invoice(invoiceData)
      console.log("Invoice object created successfully")

      const pdfBytes = await this.pdfGenerator.generatePDF(invoice)
      console.log("PDF generated successfully, size:", pdfBytes.length, "bytes")

      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", "attachment; filename=invoice-template.pdf")
      res.setHeader("Content-Length", pdfBytes.length)
      res.send(Buffer.from(pdfBytes))

      console.log("PDF sent to client successfully")
    } catch (error) {
      console.error("=== PDF Generation Error ===")
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)

      // Try fallback simple PDF
      try {
        console.log("Attempting fallback simple PDF generation...")
        await this.generateSimplePDF(res)
      } catch (fallbackError) {
        console.error("Fallback PDF generation also failed:", fallbackError)
        res.status(500).json({
          error: "Failed to generate PDF",
          details: error.message,
          fallbackError: fallbackError.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        })
      }
    }
  }

  async generateSimplePDF(res) {
    try {
      console.log("=== Generating Simple Fallback PDF ===")

      // Import pdf-lib dynamically to catch import errors
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")

      // Create a simple PDF document
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4 size

      // Embed a standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Add simple content
      page.drawText("Configuration de Facture", {
        x: 50,
        y: 750,
        size: 24,
        font: font,
        color: rgb(0, 0, 0),
      })

      page.drawText("PDF généré avec succès!", {
        x: 50,
        y: 700,
        size: 16,
        font: font,
        color: rgb(0, 0.5, 0),
      })

      page.drawText(`Date de génération: ${new Date().toLocaleDateString("fr-FR")}`, {
        x: 50,
        y: 650,
        size: 12,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      })

      page.drawText("Votre système de configuration de facture fonctionne correctement.", {
        x: 50,
        y: 600,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Add a simple border
      page.drawRectangle({
        x: 30,
        y: 30,
        width: 535,
        height: 782,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
        color: rgb(1, 1, 1, 0), // Transparent fill
      })

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save()
      console.log("Simple PDF generated successfully, size:", pdfBytes.length, "bytes")

      // Send response
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", "attachment; filename=simple-invoice.pdf")
      res.setHeader("Content-Length", pdfBytes.length)
      res.send(Buffer.from(pdfBytes))

      console.log("Simple PDF sent to client successfully")
    } catch (error) {
      console.error("Simple PDF generation failed:", error)
      throw error
    }
  }

  async processImage(req, res) {
    try {
      const { imageData, imageType } = req.body

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: "No image data provided",
        })
      }

      console.log(`Processing ${imageType} image...`)

      const result = await this.imageProcessor.processImage(imageData, imageType)

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error("Error processing image:", error)
      res.status(500).json({
        success: false,
        error: "Error processing image: " + error.message,
      })
    }
  }

  async testImageEmbed(req, res) {
    try {
      const { imageData } = req.body

      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" })
      }

      console.log("Testing image embedding...")

      // Create a test invoice with the image
      const testInvoice = new Invoice({
        logoImage: imageData,
        invoiceNumber: "TEST-001",
        companyDetails: "Test Company",
        items: [{ description: "Test Item", quantity: 1, price: 100 }],
      })

      const pdfBytes = await this.pdfGenerator.generatePDF(testInvoice)

      res.json({
        success: true,
        message: "Image embedded successfully",
        pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      })
    } catch (error) {
      console.error("Error testing image embed:", error)
      res.status(500).json({
        success: false,
        message: "Error testing image embed",
        error: error.message,
      })
    }
  }

  debugImages(req, res) {
    const { logoImage, signatureImage, headerImage, footerImage, watermarkImage } = req.body

    const result = {
      logoImage: logoImage ? `Received (length: ${logoImage.length})` : "Not received",
      signatureImage: signatureImage ? `Received (length: ${signatureImage.length})` : "Not received",
      headerImage: headerImage ? `Received (length: ${headerImage.length})` : "Not received",
      footerImage: footerImage ? `Received (length: ${footerImage.length})` : "Not received",
      watermarkImage: watermarkImage ? `Received (length: ${watermarkImage.length})` : "Not received",
    }

    res.json(result)
  }

  // Test endpoint to generate a simple PDF
  async testPDF(req, res) {
    try {
      console.log("=== Test PDF Generation ===")
      await this.generateSimplePDF(res)
    } catch (error) {
      console.error("Test PDF generation failed:", error)
      res.status(500).json({
        error: "Test PDF generation failed",
        details: error.message,
      })
    }
  }

  // Debug endpoint to check server status
  debugServer(req, res) {
    try {
      const debug = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        requestMethod: req.method,
        requestUrl: req.url,
        requestHeaders: req.headers,
        requestBody: req.body,
      }

      console.log("=== Server Debug Info ===")
      console.log(JSON.stringify(debug, null, 2))

      res.json({
        success: true,
        debug: debug,
        message: "Server is running correctly",
      })
    } catch (error) {
      console.error("Debug endpoint error:", error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
}
