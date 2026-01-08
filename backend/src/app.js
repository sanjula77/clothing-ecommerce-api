import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
  });
});

export default app;
