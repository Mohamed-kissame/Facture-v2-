export class ImageProcessor {
  constructor() {
    this.supportedFormats = ["png", "jpeg", "jpg", "svg"]
    this.maxFileSize = 50 * 1024 * 1024 // 50MB
  }

  async processImage(imageData, imageType) {
    try {
      const validation = this.validateImage(imageData)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const processedData = await this.convertImage(imageData, imageType)

      return {
        success: true,
        processedImageData: processedData,
        message: `${imageType} image processed successfully`,
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  validateImage(imageData) {
    if (!imageData) {
      return { isValid: false, error: "No image data provided" }
    }

    if (typeof imageData !== "string") {
      return { isValid: false, error: "Invalid image data format" }
    }

    if (!imageData.startsWith("data:")) {
      return { isValid: false, error: "Invalid data URL format" }
    }

    if (imageData.length > this.maxFileSize) {
      return { isValid: false, error: "Image file too large" }
    }

    return { isValid: true }
  }

  async convertImage(imageData, imageType) {
    // SVG to PNG conversion logic would go here
    // For now, return the original data
    return imageData
  }

  detectImageType(imageData) {
    if (imageData.includes("image/png")) return "png"
    if (imageData.includes("image/jpeg") || imageData.includes("image/jpg")) return "jpeg"
    if (imageData.includes("image/svg+xml")) return "svg"

    // Fallback to header detection
    const base64Data = imageData.split(",")[1]
    const imageBytes = Buffer.from(base64Data, "base64")
    const header = imageBytes.slice(0, 8).toString("hex").toUpperCase()

    if (header.startsWith("89504E47")) return "png"
    if (header.startsWith("FFD8FF")) return "jpeg"
    if (header.includes("3C737667")) return "svg"

    return "unknown"
  }

  async embedImageInPDF(pdfDoc, imageData) {
    if (!imageData || typeof imageData !== "string") {
      return null
    }

    try {
      const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData.substring(5)

      if (!base64Data) return null

      const imageBytes = Buffer.from(base64Data, "base64")
      const imageType = this.detectImageType(imageData)

      switch (imageType) {
        case "png":
          return await pdfDoc.embedPng(imageBytes)
        case "jpeg":
          return await pdfDoc.embedJpg(imageBytes)
        case "svg":
          console.log("SVG format not directly supported by pdf-lib")
          return null
        default:
          // Try both formats
          try {
            return await pdfDoc.embedPng(imageBytes)
          } catch {
            return await pdfDoc.embedJpg(imageBytes)
          }
      }
    } catch (error) {
      console.error("Error embedding image:", error)
      return null
    }
  }
}
