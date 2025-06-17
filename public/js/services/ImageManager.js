export class ImageManager {
  constructor(invoiceModel) {
    this.invoiceModel = invoiceModel
    this.setupImageUploads()
  }

  setupImageUploads() {
    const imageBoxes = [
      { id: "logo-upload", type: "logoImage" },
      { id: "signature-upload", type: "signatureImage" },
      { id: "header-image-upload", type: "headerImage" },
      { id: "footer-image-upload", type: "footerImage" },
      { id: "watermark-upload", type: "watermarkImage" },
    ]

    imageBoxes.forEach((box) => {
      const element = document.getElementById(box.id)
      if (element) {
        this.setupImageUpload(element, box.type)
      }
    })
  }

  setupImageUpload(uploadBox, imageType) {
    // Click to upload
    uploadBox.addEventListener("click", () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => this.handleFileSelect(e, imageType)
      input.click()
    })

    // Drag and drop
    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault()
      uploadBox.classList.add("drag-over")
    })

    uploadBox.addEventListener("dragleave", () => {
      uploadBox.classList.remove("drag-over")
    })

    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault()
      uploadBox.classList.remove("drag-over")
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.handleFile(files[0], imageType)
      }
    })
  }

  handleFileSelect(event, imageType) {
    const file = event.target.files[0]
    if (file) {
      this.handleFile(file, imageType)
    }
  }

  handleFile(file, imageType) {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide.")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      alert("Le fichier est trop volumineux. Limite: 50MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target.result
      this.invoiceModel.setImage(imageType, imageData)
      this.updateUploadBoxPreview(imageType, imageData)
    }
    reader.readAsDataURL(file)
  }

  updateUploadBoxPreview(imageType, imageData) {
    const boxIds = {
      logoImage: "logo-upload",
      signatureImage: "signature-upload",
      headerImage: "header-image-upload",
      footerImage: "footer-image-upload",
      watermarkImage: "watermark-upload",
    }

    const boxId = boxIds[imageType]
    const box = document.getElementById(boxId)

    if (box && imageData) {
      box.style.backgroundImage = `url(${imageData})`
      box.style.backgroundSize = "cover"
      box.style.backgroundPosition = "center"
      box.innerHTML = `<span style="background: rgba(0,0,0,0.7); color: white; padding: 5px; border-radius: 3px;">Image téléchargée</span>`
    }
  }
}
