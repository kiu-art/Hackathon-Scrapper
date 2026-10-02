const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Directs Puppeteer to store Chrome inside the backend directory so Render keeps it
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};