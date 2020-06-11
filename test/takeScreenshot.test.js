const fetch = require("node-fetch");
const assert = require("assert");
const fs = require("fs").promises;
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

const config = require("../src/config.js");
const runServer = require("../src/runServer.js");

const endpoint = `${config.server.protocol}://${config.server.host}:${config.server.port}/api/cook`;

async function compareImage({ imageName, imageBuffer }) {
  let expectedImage;
  try {
    const expectedImageBuffer = await fs.readFile(
      `./test/images/${imageName}.png`
    );
    expectedImage = PNG.sync.read(expectedImageBuffer);
  } catch (error) {
    await fs.writeFile(`./test/images/${imageName}.png`, imageBuffer);
    console.log("\tnew image was successful written");
    return;
  }

  try {
    const image = PNG.sync.read(imageBuffer);

    const numDiffPixels = pixelmatch(
      image.data,
      expectedImage.data,
      null,
      expectedImage.width,
      expectedImage.height,
      {
        threshold: 0.1,
      }
    );

    assert.strictEqual(
      numDiffPixels,
      0,
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
    const imageName = "theme";
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
    const imageName = "backgroundColorRgba";
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
    const imageName = "backgroundColorHex";
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
    assert.strictEqual(
      body.error,
      "option 'backgroundColor' has type 'number', but 'string' expected"
    );
  });

  it("should change dropShadow", async () => {
    const imageName = "dropShadow";
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadow: false,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate dropShadow", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadow: "hello",
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'dropShadow' has type 'string', but 'boolean' expected"
    );
  });

  it("should change dropShadowBlurRadius", async () => {
    const imageName = "dropShadowBlurRadius";
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadowBlurRadius: "10px",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate dropShadowBlurRadius", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadowBlurRadius: 10,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'dropShadowBlurRadius' has type 'number', but 'string' expected"
    );
  });

  it("should change dropShadowOffsetY", async () => {
    const imageName = "dropShadowOffsetY";
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadowOffsetY: "100px",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate dropShadowOffsetY", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      dropShadowOffsetY: false,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'dropShadowOffsetY' has type 'boolean', but 'string' expected"
    );
  });

  it("should change exportSize", async () => {
    const imageName = "exportSize";
    const params = {
      code: "const sum = (a, b) => a + b",
      exportSize: "1x",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate exportSize", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      exportSize: 5,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'exportSize' has type 'number', but 'string' expected"
    );
  });

  it("should change fontFamily to JetBrains Mono", async () => {
    const imageName = "fontFamilyJetBrainsMono";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontFamily: "JetBrains Mono",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should change fontFamily to Fira Code", async () => {
    const imageName = "fontFamilyFiraCode";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontFamily: "Fira Code",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate fontFamily", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      fontFamily: 5,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'fontFamily' has type 'number', but 'string' expected"
    );
  });

  it("should change firstLineNumber", async () => {
    const imageName = "firstLineNumber";
    const params = {
      code: "const sum = (a, b) => a + b",
      firstLineNumber: 42,
      lineNumbers: true,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate firstLineNumber", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      firstLineNumber: "one",
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'firstLineNumber' has type 'string', but 'number' expected"
    );
  });

  it("should change fontSize", async () => {
    const imageName = "fontSize";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontSize: "30px",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate fontSize", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      fontSize: true,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'fontSize' has type 'boolean', but 'string' expected"
    );
  });

  it("should change language", async () => {
    const imageName = "language";
    const params = {
      code: "const sum = (a, b) => a + b",
      language: "application/x-sh",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate language", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      language: true,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'language' has type 'boolean', but 'string' expected"
    );
  });
});
