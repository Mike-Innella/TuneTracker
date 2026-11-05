import "dotenv/config";
import http from "http";
import app from "./app";
import { prisma } from "./lib/prisma";
import { env } from "./lib/env";

const PORT = env.port;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function shutdown(signal: string) {
  console.log(`[shutdown] ${signal} received`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("[shutdown] prisma disconnected");
    } catch (e) {
      console.error("[shutdown] prisma disconnect error", e);
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
