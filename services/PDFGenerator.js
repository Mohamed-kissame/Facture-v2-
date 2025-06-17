import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { ImageProcessor } from "./ImageProcessor.js"

export class PDFGenerator {
  constructor() {
    this.imageProcessor = new ImageProcessor()
    this.pageWidth = 595
    this.pageHeight = 842
  }

  async generatePDF(invoice) {
    try {
      console.log("Starting PDF generation with data:", JSON.stringify(invoice, null, 2))

      const validation = invoice.validate()
      if (!validation.isValid) {
        console.warn("Validation warnings:", validation.errors)
        // Continue anyway for testing
      }

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([this.pageWidth, this.pageHeight])

      const renderer = new InvoiceRenderer(page, this.imageProcessor)
      await renderer.render(invoice)

      const pdfBytes = await pdfDoc.save()
      console.log("PDF generated successfully, size:", pdfBytes.length, "bytes")

      return pdfBytes
    } catch (error) {
      console.error("Error generating PDF:", error)
      throw error
    }
  }
}

export class InvoiceRenderer {
  constructor(page, imageProcessor) {
    this.page = page
    this.imageProcessor = imageProcessor
    this.width = page.getSize().width
    this.height = page.getSize().height
  }

  async render(invoice) {
    try {
      // Set up font
      const font = await this.getFont(invoice.font)

      // Add a basic page structure even if empty
      this.renderPageBorder()

      // Render components only if they have content
      await this.renderWatermark(invoice)
      await this.renderHeader(invoice)
      this.renderModel(invoice)
      await this.renderLogo(invoice)
      this.renderCompanyDetails(invoice, font)
      this.renderClientDetails(invoice, font)
      this.renderInvoiceTitle(invoice, font)
      this.renderDates(invoice, font)
      this.renderItemsTable(invoice, font)
      this.renderSummary(invoice, font)
      await this.renderFooter(invoice, font)
      await this.renderSignature(invoice)

      // Render custom components if present
      if (invoice.components) {
        await this.renderComponents(invoice.components, font)
      }

      // Add empty state message if no content
      if (this.isEmpty(invoice)) {
        this.renderEmptyState(font)
      }
    } catch (error) {
      console.error("Error in render:", error)
      // Render error message on PDF
      const font = await this.page.doc.embedFont(StandardFonts.Helvetica)
      this.page.drawText("Erreur lors du rendu: " + error.message, {
        x: 50,
        y: this.height - 100,
        size: 12,
        font: font,
        color: rgb(1, 0, 0),
      })
    }
  }

  async renderComponents(components, font) {
    if (!components || !Array.isArray(components)) return

    for (const component of components) {
      try {
        await this.renderComponent(component, font)
      } catch (error) {
        console.error(`Error rendering component ${component.id}:`, error)
      }
    }
  }

  async renderComponent(component, font) {
    if (!component || !component.type) return

    const position = component.position || { x: 50, y: 50 }
    const x = position.x
    const y = this.height - position.y

    switch (component.type) {
      case "text":
        if (component.content) {
          this.page.drawText(component.content, {
            x,
            y,
            size: 10,
            font,
            color: rgb(0, 0, 0),
            maxWidth: component.size?.width || 200,
            lineHeight: 15,
          })
        }
        break

      case "separator":
        const thickness = component.thickness || 2
        const width = component.size?.width || 200
        const color = this.hexToRgb(component.color || "#000000")

        this.page.drawLine({
          start: { x, y },
          end: { x: x + width, y },
          thickness,
          color: rgb(color.r, color.g, color.b),
        })
        break

      case "pager":
        const format = component.format || "Page {page} sur {total}"
        const pageText = format.replace("{page}", "1").replace("{total}", "1")

        this.page.drawText(pageText, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })
        break

      case "invoice-data":
        if (component.content) {
          this.page.drawText(component.content, {
            x,
            y,
            size: 10,
            font,
            color: rgb(0, 0, 0),
            maxWidth: component.size?.width || 200,
            lineHeight: 15,
          })
        }
        break

      case "invoice-dates":
        if (component.dates) {
          this.page.drawText(`Date de la facture: ${component.dates.invoiceDate}`, {
            x,
            y,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          })

          this.page.drawText(`Date d'échéance: ${component.dates.dueDate}`, {
            x,
            y: y - 20,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          })
        }
        break

      case "invoice-table":
        if (component.rows && component.rows.length > 0) {
          await this.renderCustomTable(component.rows, x, y, font)
        }
        break

      case "invoice-summary":
        if (component.summary) {
          await this.renderCustomSummary(component.summary, x, y, font)
        }
        break

      case "image":
        if (component.imageData) {
          await this.renderCustomImage(component.imageData, x, y, component.size)
        }
        break
    }
  }

  async renderCustomTable(rows, x, y, font) {
    if (!rows || rows.length === 0) return

    const columnWidths = [200, 50, 70, 50, 70]
    const rowHeight = 25
    let currentY = y

    // Draw header
    const headers = ["Description", "Quantité", "Prix unitaire", "TVA", "Total"]

    for (let i = 0; i < headers.length; i++) {
      this.page.drawText(headers[i], {
        x: x + (i > 0 ? columnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0),
        y: currentY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }

    currentY -= 15

    // Draw header line
    this.page.drawLine({
      start: { x, y: currentY + 5 },
      end: { x: x + columnWidths.reduce((a, b) => a + b, 0), y: currentY + 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    currentY -= 10

    // Draw rows
    for (const row of rows) {
      const description = row.description || ""
      const quantity = row.quantity || 0
      const unitPrice = row.unitPrice || 0
      const tax = row.tax || 0
      const total = row.total || 0

      this.page.drawText(description, {
        x,
        y: currentY,
        size: 10,
        font,
        maxWidth: columnWidths[0] - 5,
      })

      this.page.drawText(quantity.toString(), {
        x: x + columnWidths[0],
        y: currentY,
        size: 10,
        font,
      })

      this.page.drawText(unitPrice.toFixed(2) + " €", {
        x: x + columnWidths[0] + columnWidths[1],
        y: currentY,
        size: 10,
        font,
      })

      this.page.drawText(tax + "%", {
        x: x + columnWidths[0] + columnWidths[1] + columnWidths[2],
        y: currentY,
        size: 10,
        font,
      })

      this.page.drawText(total.toFixed(2) + " €", {
        x: x + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3],
        y: currentY,
        size: 10,
        font,
      })

      currentY -= rowHeight
    }
  }

  async renderCustomSummary(summary, x, y, font) {
    if (!summary) return

    const rowHeight = 20
    let currentY = y

    // Draw subtotal
    this.page.drawText("Sous-total:", {
      x,
      y: currentY,
      size: 10,
      font,
    })

    this.page.drawText(summary.subtotal.toFixed(2) + " €", {
      x: x + 150,
      y: currentY,
      size: 10,
      font,
    })

    currentY -= rowHeight

    // Draw tax
    this.page.drawText(`TVA (${summary.taxRate}%):`, {
      x,
      y: currentY,
      size: 10,
      font,
    })

    this.page.drawText(summary.taxAmount.toFixed(2) + " €", {
      x: x + 150,
      y: currentY,
      size: 10,
      font,
    })

    currentY -= rowHeight

    // Draw line
    this.page.drawLine({
      start: { x, y: currentY + 10 },
      end: { x: x + 180, y: currentY + 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    // Draw total
    this.page.drawText("Total:", {
      x,
      y: currentY,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    })

    this.page.drawText(summary.total.toFixed(2) + " €", {
      x: x + 150,
      y: currentY,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    })
  }

  async renderCustomImage(imageData, x, y, size) {
    try {
      const imageEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, imageData)

      if (!imageEmbed) return

      const imgWidth = size?.width || 100
      const imgHeight = size?.height || (imgWidth / imageEmbed.width) * imageEmbed.height

      this.page.drawImage(imageEmbed, {
        x,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight,
      })
    } catch (error) {
      console.error("Failed to render custom image:", error)
    }
  }

  isEmpty(invoice) {
    return (
      !invoice.companyDetails &&
      !invoice.clientDetails &&
      !invoice.invoiceNumber &&
      invoice.items.length === 0 &&
      !invoice.images.hasLogo() &&
      !invoice.images.hasSignature() &&
      !invoice.slogan &&
      !invoice.paymentInfo &&
      (!invoice.components || invoice.components.length === 0)
    )
  }

  renderEmptyState(font) {
    // Add empty state message
    this.page.drawText("Facture vide - Ajoutez des composants pour voir le contenu", {
      x: this.width / 2 - 200,
      y: this.height / 2,
      size: 14,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    this.page.drawText("Généré le: " + new Date().toLocaleDateString("fr-FR"), {
      x: this.width / 2 - 80,
      y: this.height / 2 - 30,
      size: 10,
      font: font,
      color: rgb(0.7, 0.7, 0.7),
    })
  }

  renderPageBorder() {
    // Add a subtle border to show the page
    this.page.drawRectangle({
      x: 10,
      y: 10,
      width: this.width - 20,
      height: this.height - 20,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
      color: rgb(1, 1, 1, 0),
    })
  }

  async getFont(fontName) {
    const pdfDoc = this.page.doc
    try {
      switch (fontName) {
        case "Times New Roman":
          return await pdfDoc.embedFont(StandardFonts.TimesRoman)
        case "Courier New":
          return await pdfDoc.embedFont(StandardFonts.Courier)
        default:
          return await pdfDoc.embedFont(StandardFonts.Helvetica)
      }
    } catch (error) {
      console.warn("Font embedding failed, using Helvetica:", error)
      return await pdfDoc.embedFont(StandardFonts.Helvetica)
    }
  }

  calculatePosition(positionData, elementId, property, defaultValue) {
    if (!positionData || !positionData[elementId] || !positionData[elementId][property]) {
      return defaultValue
    }

    const percentage = Number.parseFloat(positionData[elementId][property]) / 100

    switch (property) {
      case "x":
        return percentage * this.width
      case "y":
        return this.height - percentage * this.height
      case "size":
        return percentage * 2
      default:
        return defaultValue
    }
  }

  hexToRgb(hex) {
    if (!hex || hex.length !== 7) {
      return { r: 0, g: 0, b: 0 }
    }

    try {
      const r = Number.parseInt(hex.slice(1, 3), 16) / 255
      const g = Number.parseInt(hex.slice(3, 5), 16) / 255
      const b = Number.parseInt(hex.slice(5, 7), 16) / 255
      return { r, g, b }
    } catch (error) {
      console.warn("Invalid hex color:", hex)
      return { r: 0, g: 0, b: 0 }
    }
  }

  async renderWatermark(invoice) {
    if (!invoice.images.hasWatermark()) return

    try {
      const watermarkEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, invoice.images.watermarkImage)

      if (!watermarkEmbed) return

      const x = this.calculatePosition(invoice.positionData, "watermark", "x", this.width / 2)
      const y = this.calculatePosition(invoice.positionData, "watermark", "y", this.height / 2)
      const size = this.calculatePosition(invoice.positionData, "watermark", "size", 1)
      const opacity = invoice.images.watermarkOpacity / 100

      const imgWidth = Math.min(this.width * 0.8, watermarkEmbed.width) * size
      const imgHeight = (imgWidth / watermarkEmbed.width) * watermarkEmbed.height

      this.page.drawImage(watermarkEmbed, {
        x: x - imgWidth / 2,
        y: y - imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
        opacity: opacity,
      })
    } catch (error) {
      console.warn("Failed to render watermark:", error)
    }
  }

  async renderHeader(invoice) {
    if (!invoice.images.headerImage) return

    try {
      const headerEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, invoice.images.headerImage)

      if (!headerEmbed) return

      const x = this.calculatePosition(invoice.positionData, "header-image", "x", this.width / 2)
      const y = this.calculatePosition(invoice.positionData, "header-image", "y", this.height - 50)
      const size = this.calculatePosition(invoice.positionData, "header-image", "size", 1)

      const imgWidth = Math.min(this.width - 40, headerEmbed.width) * size
      const imgHeight = (imgWidth / headerEmbed.width) * headerEmbed.height

      this.page.drawImage(headerEmbed, {
        x: x - imgWidth / 2,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight,
      })
    } catch (error) {
      console.warn("Failed to render header image:", error)
    }
  }

  renderModel(invoice) {
    try {
      const primaryRgb = this.hexToRgb(invoice.primaryColor)

      switch (invoice.model) {
        case "boxed":
          this.page.drawRectangle({
            x: 20,
            y: 20,
            width: 555,
            height: 802,
            borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
            borderWidth: 2,
            color: rgb(1, 1, 1, 0),
          })
          break
        case "bold":
          this.page.drawRectangle({
            x: 0,
            y: 792,
            width: 595,
            height: 50,
            color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
          })
          break
      }
    } catch (error) {
      console.warn("Failed to render model:", error)
    }
  }

  async renderLogo(invoice) {
    if (!invoice.images.hasLogo()) return

    try {
      const logoEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, invoice.images.logoImage)

      if (!logoEmbed) return

      const x = this.calculatePosition(invoice.positionData, "logo", "x", 50)
      const y = this.calculatePosition(invoice.positionData, "logo", "y", this.height - 50)
      const size = this.calculatePosition(invoice.positionData, "logo", "size", 1)

      const imgWidth = Math.min(100, logoEmbed.width) * size
      const imgHeight = (imgWidth / logoEmbed.width) * logoEmbed.height

      this.page.drawImage(logoEmbed, {
        x: x,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight,
      })
    } catch (error) {
      console.warn("Failed to render logo:", error)
    }
  }

  renderCompanyDetails(invoice, font) {
    if (!invoice.companyDetails) return

    try {
      const x = this.calculatePosition(invoice.positionData, "company-details", "x", 50)
      const y = this.calculatePosition(invoice.positionData, "company-details", "y", this.height - 100)

      this.page.drawText(invoice.companyDetails.replace(/\n/g, " "), {
        x: x,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        lineHeight: 15,
        maxWidth: 200,
      })
    } catch (error) {
      console.warn("Failed to render company details:", error)
    }
  }

  renderClientDetails(invoice, font) {
    if (!invoice.clientDetails) return

    try {
      const x = this.calculatePosition(invoice.positionData, "client-details", "x", 350)
      const y = this.calculatePosition(invoice.positionData, "client-details", "y", this.height - 100)

      this.page.drawText(invoice.clientDetails.replace(/\n/g, " "), {
        x: x,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        lineHeight: 15,
        maxWidth: 200,
      })
    } catch (error) {
      console.warn("Failed to render client details:", error)
    }
  }

  renderInvoiceTitle(invoice, font) {
    if (!invoice.invoiceNumber) return

    try {
      const primaryRgb = this.hexToRgb(invoice.primaryColor)
      const x = this.calculatePosition(invoice.positionData, "invoice-number", "x", 50)
      const y = this.calculatePosition(invoice.positionData, "invoice-number", "y", this.height - 200)

      this.page.drawText(invoice.invoiceNumber, {
        x: x,
        y: y,
        size: 16,
        font: font,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
      })
    } catch (error) {
      console.warn("Failed to render invoice title:", error)
    }
  }

  renderDates(invoice, font) {
    try {
      const x = this.calculatePosition(invoice.positionData, "dates", "x", 50)
      let y = this.calculatePosition(invoice.positionData, "dates", "y", this.height - 230)

      if (invoice.invoiceDate) {
        const date = new Date(invoice.invoiceDate)
        const formattedDate = date.toLocaleDateString("fr-FR")
        this.page.drawText(`Date de la facture: ${formattedDate}`, {
          x: x,
          y: y,
          size: 10,
          font: font,
        })
        y -= 15
      }

      if (invoice.dueDate) {
        const date = new Date(invoice.dueDate)
        const formattedDate = date.toLocaleDateString("fr-FR")
        this.page.drawText(`Date d'échéance: ${formattedDate}`, {
          x: x,
          y: y,
          size: 10,
          font: font,
        })
      }
    } catch (error) {
      console.warn("Failed to render dates:", error)
    }
  }

  renderItemsTable(invoice, font) {
    if (!invoice.items || invoice.items.length === 0) return

    try {
      const tableHeaders = ["Description", "Quantité", "Prix unitaire", "Taxes", "Montant"]
      const tableX = [50, 300, 370, 440, 510]
      let y = this.calculatePosition(invoice.positionData, "items-table", "y", this.height - 280)

      // Headers
      for (let i = 0; i < tableHeaders.length; i++) {
        this.page.drawText(tableHeaders[i], {
          x: tableX[i],
          y: y,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
      }

      // Header line
      this.page.drawLine({
        start: { x: 50, y: y - 10 },
        end: { x: 545, y: y - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      })

      // Items
      y -= 30
      invoice.items.forEach((item, index) => {
        const amount = item.getTotal()

        this.page.drawText(item.description || "", {
          x: tableX[0],
          y: y,
          size: 10,
          font: font,
        })

        if (item.details) {
          this.page.drawText(item.details, {
            x: tableX[0],
            y: y - 15,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          })
        }

        this.page.drawText(item.quantity.toFixed(3), {
          x: tableX[1],
          y: y,
          size: 10,
          font: font,
        })

        this.page.drawText(item.price.toFixed(2), {
          x: tableX[2],
          y: y,
          size: 10,
          font: font,
        })

        this.page.drawText(`${invoice.taxRate}%`, {
          x: tableX[3],
          y: y,
          size: 10,
          font: font,
        })

        this.page.drawText(`$ ${amount.toFixed(2)}`, {
          x: tableX[4],
          y: y,
          size: 10,
          font: font,
        })

        // Striped background
        if (invoice.model === "striped" && index % 2 === 1) {
          this.page.drawRectangle({
            x: 50,
            y: y - 20,
            width: 495,
            height: 30,
            color: rgb(0.95, 0.95, 0.95),
          })
        }

        y -= 40
      })
    } catch (error) {
      console.warn("Failed to render items table:", error)
    }
  }

  renderSummary(invoice, font) {
    if (!invoice.items || invoice.items.length === 0) return

    try {
      const subtotal = invoice.calculateSubtotal()
      const taxAmount = invoice.calculateTax()
      const total = invoice.calculateTotal()

      let y = Math.min(450, this.height - 350)

      // Subtotal
      this.page.drawText("Sous-total", {
        x: 450,
        y: y,
        size: 10,
        font: font,
      })

      this.page.drawText(`$ ${subtotal.toFixed(2)}`, {
        x: 520,
        y: y,
        size: 10,
        font: font,
      })

      // Tax
      y -= 20
      this.page.drawText(`Taxes ${invoice.taxRate}%`, {
        x: 450,
        y: y,
        size: 10,
        font: font,
      })

      this.page.drawText(`$ ${taxAmount.toFixed(2)}`, {
        x: 520,
        y: y,
        size: 10,
        font: font,
      })

      // Total
      y -= 20
      this.page.drawLine({
        start: { x: 450, y: y + 10 },
        end: { x: 545, y: y + 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      })

      this.page.drawText("Total", {
        x: 450,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      this.page.drawText(`$ ${total.toFixed(2)}`, {
        x: 520,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
    } catch (error) {
      console.warn("Failed to render summary:", error)
    }
  }

  async renderFooter(invoice, font) {
    try {
      // Footer image
      if (invoice.images.footerImage) {
        const footerEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, invoice.images.footerImage)

        if (footerEmbed) {
          const x = this.calculatePosition(invoice.positionData, "footer-image", "x", this.width / 2)
          const y = this.calculatePosition(invoice.positionData, "footer-image", "y", 100)
          const size = this.calculatePosition(invoice.positionData, "footer-image", "size", 1)

          const imgWidth = Math.min(this.width - 40, footerEmbed.width) * size
          const imgHeight = (imgWidth / footerEmbed.width) * footerEmbed.height

          this.page.drawImage(footerEmbed, {
            x: x - imgWidth / 2,
            y: y,
            width: imgWidth,
            height: imgHeight,
          })
        }
      }

      // Payment info
      if (invoice.paymentInfo) {
        const x = this.calculatePosition(invoice.positionData, "payment-info", "x", 50)
        const y = this.calculatePosition(invoice.positionData, "payment-info", "y", 150)

        this.page.drawText(invoice.paymentInfo.replace(/\n/g, " "), {
          x: x,
          y: y,
          size: 10,
          font: font,
        })
      }

      // Footer number
      if (invoice.footerNumber) {
        const x = this.calculatePosition(invoice.positionData, "footer-number", "x", 297.5)
        const y = this.calculatePosition(invoice.positionData, "footer-number", "y", 50)

        this.page.drawText(invoice.footerNumber, {
          x: x - invoice.footerNumber.length * 3,
          y: y,
          size: 10,
          font: font,
        })
      }

      // Slogan
      if (invoice.slogan) {
        const x = this.calculatePosition(invoice.positionData, "slogan", "x", 297.5)
        const y = this.calculatePosition(invoice.positionData, "slogan", "y", 30)

        this.page.drawText(invoice.slogan, {
          x: x - invoice.slogan.length * 3,
          y: y,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        })
      }
    } catch (error) {
      console.warn("Failed to render footer:", error)
    }
  }

  async renderSignature(invoice) {
    if (!invoice.images.hasSignature()) return

    try {
      const signatureEmbed = await this.imageProcessor.embedImageInPDF(this.page.doc, invoice.images.signatureImage)

      if (!signatureEmbed) return

      const x = this.calculatePosition(invoice.positionData, "signature", "x", 400)
      const y = this.calculatePosition(invoice.positionData, "signature", "y", 120)
      const size = this.calculatePosition(invoice.positionData, "signature", "size", 1)

      const imgWidth = Math.min(150, signatureEmbed.width) * size
      const imgHeight = (imgWidth / signatureEmbed.width) * signatureEmbed.height

      this.page.drawImage(signatureEmbed, {
        x: x,
        y: y,
        width: imgWidth,
        height: imgHeight,
      })
    } catch (error) {
      console.warn("Failed to render signature:", error)
    }
  }
}
