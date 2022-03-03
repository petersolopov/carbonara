const fetch = require("node-fetch");
const formData = require("form-data");
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
    // Expected test image has not already existed. Write it
    if (error.code === "ENOENT") {
      await fs.writeFile(`./test/images/${imageName}.png`, imageBuffer);
      console.log("\tnew image was successful written");
      return;
    }

    throw error;
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
    // Writing file in CI throws error: EACCES: permission denied
    if (process.env.CI !== "true") {
      await fs.writeFile(`./test/images/${imageName}.png`, imageBuffer);
      console.log("image was updated");
    }
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

async function fetchImageMultipart(params) {
  const multipartFormData = new formData();
  for (const [key, value] of Object.entries(params)) {
    multipartFormData.append(key, value);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: multipartFormData,
    headers: {
      "Content-Type": `multipart/form-data;boundary=${multipartFormData.getBoundary()}`,
    },
  });
  return response;
}

async function loadFont(fontName) {
  const buffer = await fs.readFile(`./test/fonts/${fontName}`);
  return buffer.toString("base64");
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

  it("should create default image (multipart)", async () => {
    const imageName = "defaultMultipart";
    const params = { code: "const sum = (a, b) => a + b" };
    const response = await fetchImageMultipart(params);
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

  it("should change background color with transparency", async () => {
    const imageName = "transparentBackgroundColor";
    const params = {
      code: "const sum = (a, b) => a + b",
      backgroundColor: "rgba(31,129,109,.3)",
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

  it("should change lineHeight", async () => {
    const imageName = "lineHeight";
    const params = {
      code: "// some comment\nconst sum = (a, b) => a + b",
      lineHeight: "200%",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate lineHeight", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      lineHeight: true,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'lineHeight' has type 'boolean', but 'string' expected"
    );
  });

  it("should change lineNumbers", async () => {
    const imageName = "lineNumbers";
    const params = {
      code: "// some comment\nconst sum = (a, b) => a + b",
      lineNumbers: true,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate lineNumbers", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      lineNumbers: "yes",
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'lineNumbers' has type 'string', but 'boolean' expected"
    );
  });

  it("should change paddingHorizontal", async () => {
    const imageName = "paddingHorizontal";
    const params = {
      code: "const sum = (a, b) => a + b",
      paddingHorizontal: "100px",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate paddingHorizontal", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      paddingHorizontal: true,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'paddingHorizontal' has type 'boolean', but 'string' expected"
    );
  });

  it("should change paddingVertical", async () => {
    const imageName = "paddingVertical";
    const params = {
      code: "const sum = (a, b) => a + b",
      paddingVertical: "100px",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate paddingVertical", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      paddingVertical: true,
    };
    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'paddingVertical' has type 'boolean', but 'string' expected"
    );
  });

  it("should change theme", async () => {
    const imageName = "pandaTheme";
    const params = {
      code: "const sum = (a, b) => a + b",
      theme: "panda-syntax",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate theme", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      theme: true,
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'theme' has type 'boolean', but 'string' expected"
    );
  });

  it("should change watermark", async () => {
    const imageName = "watermark";
    const params = {
      code: "const sum = (a, b) => a + b",
      watermark: true,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate watermark", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      watermark: "true",
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'watermark' has type 'string', but 'boolean' expected"
    );
  });

  it("should change width", async () => {
    const imageName = "width";
    const params = {
      code: "const sum = (a, b) => a + b",
      widthAdjustment: false,
      width: 1000,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate width", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      width: "250px",
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'width' has type 'string', but 'number' expected"
    );
  });

  it("should change widthAdjustment", async () => {
    const imageName = "widthAdjustment";
    const params = {
      code: "const sum = (a, b) => a + b",
      widthAdjustment: false,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate widthAdjustment", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      widthAdjustment: "false",
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'widthAdjustment' has type 'string', but 'boolean' expected"
    );
  });

  it("should change windowControls", async () => {
    const imageName = "windowControls";
    const params = {
      code: "const sum = (a, b) => a + b",
      windowControls: false,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate windowControls", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      windowControls: "false",
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'windowControls' has type 'string', but 'boolean' expected"
    );
  });

  it("should change windowTheme to sharp", async () => {
    const imageName = "windowTheme-sharp";
    const params = {
      code: "const sum = (a, b) => a + b",
      windowTheme: "sharp",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should change windowTheme to bw", async () => {
    const imageName = "windowTheme-bw";
    const params = {
      code: "const sum = (a, b) => a + b",
      windowTheme: "bw",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should validate windowTheme", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      windowTheme: true,
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'windowTheme' has type 'boolean', but 'string' expected"
    );
  });

  it("should validate prettify", async () => {
    const params = {
      code: "const sum = (a, b) => a + b",
      prettify: "true",
    };

    const response = await fetchImage(params);
    assert.ok(!response.ok);

    const body = await response.json();
    assert.strictEqual(
      body.error,
      "option 'prettify' has type 'string', but 'boolean' expected"
    );
  });

  it("should not prettify by default", async () => {
    const imageName = "not-prettify";
    const params = {
      code: "const  sum = (a,b) => a+ b",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should prettify code", async () => {
    const imageName = "prettify";
    const params = {
      code: "const  sum = (a,b) => a+ b",
      prettify: true,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should work with chinese language", async () => {
    const imageName = "chinese";
    const params = {
      code: "中文",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should work with russian language", async () => {
    const imageName = "russian";
    const params = {
      code: "русский язык",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should support emoji", async () => {
    const imageName = "emoji";
    const params = {
      code: "😎 🤩 😱 🍝",
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should accept custom TTF font", async () => {
    const fontCustom = await loadFont("JetBrainsMono-Bold.ttf");
    const imageName = "fontCustomTTF";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontCustom: fontCustom,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should accept custom TTF font (multipart)", async () => {
    const fontCustom = await loadFont("JetBrainsMono-Bold.ttf");
    const imageName = "fontCustomTTFMultipart";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontCustom: fontCustom,
    };
    const response = await fetchImageMultipart(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should accept custom WOFF font", async () => {
    const fontCustom = await loadFont("JetBrainsMono-Italic.woff");
    const imageName = "fontCustomWOFF";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontCustom: fontCustom,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });

  it("should accept custom WOFF2 font", async () => {
    const fontCustom = await loadFont("JetBrainsMono-Regular.woff2");
    const imageName = "fontCustomWOFF2";
    const params = {
      code: "const sum = (a, b) => a + b",
      fontCustom: fontCustom,
    };
    const response = await fetchImage(params);
    assert.ok(response.ok);
    const imageBuffer = await response.buffer();
    await compareImage({ imageName, imageBuffer });
  });
});
