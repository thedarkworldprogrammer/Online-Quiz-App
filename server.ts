import express from "express";
import path from "path";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { connectDatabase } from "./src/server/services/dbService.js";
import apiRouter from "./src/server/routes/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust first proxy hop
  app.set("trust proxy", 1);

  // 1. Initialize Database Connection (MongoDB Mongoose models)
  await connectDatabase();

  // 2. Helmet Security Headers
  // We disable default Content Security Policy so it doesn't block the preview canvas/styles inside the AI Studio frame
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. API Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per 15 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: false, // Disable proxy and header validation checks for reverse-proxy compatibility
    message: {
      error: "Too many requests from this IP, please try again after 15 minutes."
    }
  });

  // Apply rate limiter specifically to API routes
  app.use("/api", apiLimiter);

  // 4. Global Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 5. Mount Modular Route Handlers
  app.use("/api", apiRouter);

  // 6. Production Static Assets Serving / Vite Dev Middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Robust Global Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("❌ Unhandled Application Error:", err);
    
    const statusCode = err.status || err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
      error: {
        message: errorMessage,
        status: statusCode,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {})
      }
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 EduAssess AI Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
