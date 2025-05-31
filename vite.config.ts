import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "better-auth-middleware",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Only handle requests that start with /api/auth
          if (!req.url?.startsWith("/api/auth")) {
            return next();
          }

          const handleAuth = async () => {
            try {
              // Dynamically import auth configuration only when needed
              const { auth } = await import("./src/lib/auth.js");

              // Create a proper Request object for Better Auth
              const fullUrl = `http://${req.headers.host || "localhost:5173"}${req.url}`;
              const url = new URL(fullUrl);
              const headers = new Headers();

              // Copy headers from the request
              Object.entries(req.headers).forEach(([key, value]) => {
                if (typeof value === "string") {
                  headers.set(key, value);
                } else if (Array.isArray(value)) {
                  headers.set(key, value.join(", "));
                }
              });

              // Handle request body for POST requests
              let body = undefined;
              if (req.method !== "GET" && req.method !== "HEAD") {
                const chunks: Buffer[] = [];
                req.on("data", (chunk) => chunks.push(chunk));
                await new Promise((resolve) => req.on("end", resolve));
                body = Buffer.concat(chunks).toString();
              }

              const request = new Request(url.toString(), {
                method: req.method,
                headers,
                body,
              });

              // Handle with Better Auth
              const response = await auth.handler(request);

              // Send response back
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });

              res.statusCode = response.status;

              if (response.body) {
                const text = await response.text();
                res.end(text);
              } else {
                res.end();
              }
            } catch (error) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Internal Server Error",
                  message:
                    error instanceof Error ? error.message : "Unknown error",
                  details:
                    process.env.NODE_ENV === "development" ? error : undefined,
                }),
              );
            }
          };

          handleAuth();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
