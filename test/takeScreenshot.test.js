const fetch = require("node-fetch");
const assert = require("assert");
const fs = require("fs").promises;

const config = require("../src/config.js");
const runServer = require("../src/runServer.js");

const endpoint = `${config.server.protocol}://${config.server.host}:${config.server.port}/api/cook`;

async function compareImage({ imageName, imageBuffer }) {
  let expectedImage;
  try {
    expectedImage = await fs.readFile(`./test/images/${imageName}.png`);
  } catch (error) {
    await fs.writeFile(`./test/images/${imageName}.png`, imageBuffer);
    console.log("\tnew image was successful written");
    return;
  }

  try {
    const compared = Buffer.compare(imageBuffer, expectedImage);
    assert.strictEqual(
      0,
      compared,
      `screenshot comparing is failed for ${imageName}.png`
    );
  } catch (error) {
    await fs.writeFile(`./test/images/${imageName}.png`, imageBuffer);
    console.log("image was updated");
    throw error;
  }
}

async function fetchImage(params) {
  const stringifiedBody = JSON.stringify(params);
  const response = await fetch(endpoint, {
    method: "POST",
    body: stringifiedBody,
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response;
}

describe("POST /api/cook", () => {
  before(async () => {
    const { server, browser } = await runServer();
    global.server = server;
    global.browser = browser;
  });

  after(async () => {
    if (global.browser) {
      global.browser.close();
    }
    if (global.server) {
      global.server.close();
    }
  });

  it("should create default image", async () => {
    const imageName = "default";
    const params = { code: "const sum = (a, b) => a + b" };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should change theme", async () => {
    const imageName = "changedTheme";
    const params = {
      code: "const sum = (a, b) => a + b",
      theme: "monokai",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should change background color with rgba", async () => {
    const imageName = "changedBackgroundColorRgba";
    const params = {
      code: "const sum = (a, b) => a + b",
      backgroundColor: "rgba(31,129,109,1)",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should change background color with hex", async () => {
    const imageName = "changedBackgroundColorHex";
    const params = {
      code: "const sum = (a, b) => a + b",
      backgroundColor: "#000",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate backgroundColor", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      backgroundColor: 42,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.equal(
      body.error,
      "option 'backgroundColor' has type 'number', but 'string' expected"
    );
  });
});
