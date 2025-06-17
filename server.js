import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import invoiceRoutes from "./routes/invoiceRoutes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Server {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.setupMiddleware()
    this.setupRoutes()
  }

  setupMiddleware() {
    // Body parsing middleware
    this.app.use(express.json({ limit: "50mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }))

    // Static files
    this.app.use(express.static(path.join(__dirname, "public")))
  }

  setupRoutes() {
    // Main route
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"))
    })

    // API routes
    this.app.use("/api", invoiceRoutes)

    // Error handling middleware
    this.app.use(this.errorHandler)
  }

  errorHandler(error, req, res, next) {
    console.error("Server Error:", error)

    res.status(error.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    })
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`)
    })
  }
}

// Start the server
const server = new Server()
server.start()

export default Server
