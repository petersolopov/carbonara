const http = require("http");
const puppeteer = require("puppeteer-core");

const takeScreenshot = require("./takeScreenshot.js");
const config = require("./config.js");

async function runServer() {
  const base = `${config.server.protocol}://${config.server.host}:${config.server.port}`;

  const browser = await puppeteer.launch({
    args: [
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    executablePath: "/usr/bin/chromium-browser",
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, base);

    if (url.pathname === "/api/cook" && req.method === "POST") {
      takeScreenshot({ req, res, browser });
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  server.listen(config.server.port, () => {
    console.log(`server run on ${base}`);
  });

  return { server, browser };
}

module.exports = runServer;
