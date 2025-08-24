// index.js
import { voiceClient } from "./client.js";
import tokens from "./tokens.js";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

// Health check لـ Render
app.get("/", (req, res) => {
  res.status(200).send("✅ Discord Voice Client is running");
});

app.listen(port, () => {
  console.log(`🌐 Web server running on port ${port}`);
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// تنظيف التوكنات
const cleanTokens = tokens.reduce((acc, token) => {
  const isValid = token?.token?.length > 30;
  const isDuplicate = acc.some((t) => t.token === token.token);
  if (isValid && !isDuplicate) {
    acc.push(token);
  } else {
    console.warn("⚠️ Invalid or duplicate token configuration:", token);
  }
  return acc;
}, []);

// تشغيل كل عميل
for (const token of cleanTokens) {
  const client = new voiceClient(token);

  client.on("ready", (user) => {
    console.log(`✅ Logged in as ${user.username}#${user.discriminator}`);
  });

  client.on("connected", () => {
    console.log("🌐 Connected to Discord Gateway");
  });

  client.on("disconnected", () => {
    console.log("🔌 Disconnected from Discord");
  });

  client.on("voiceReady", () => {
    console.log("🎧 Voice channel joined successfully");
  });

  client.on("error", (error) => {
    console.error("❌ Error:", error);
  });

  client.on("debug", (message) => {
    console.debug(message);
  });

  client.connect();
}
