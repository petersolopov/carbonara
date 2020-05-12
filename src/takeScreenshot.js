const getRawBody = require("raw-body");

const config = require("./config.js");
const {
  createSearchString,
  validateBody,
  defaultOptions,
} = require("./utils.js");

module.exports = async (ctx) => {
  const { req, res, browser } = ctx;

  let body;
  try {
    const isContentTypeJSON =
      req.headers["content-type"] &&
      req.headers["content-type"].includes("application/json");

    if (!isContentTypeJSON) {
      throw new Error("body should be a JSON");
    }

    const rawBody = await getRawBody(req, {
      length: req.headers["content-length"],
      limit: "1mb",
      encoding: true,
    });

    body = JSON.parse(rawBody);
    validateBody(body);
  } catch (error) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 400;
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  const page = await browser.newPage();
  const searchQuery = createSearchString(body);

  await page.goto(`${config.carbon.url}${searchQuery}`);

  const deviceScaleFactor = +{ ...defaultOptions, ...body }["exportSize"][0];

  await page.setViewport({
    width: 8192, // big enough
    height: 128, // doesn't matter
    deviceScaleFactor,
  });

  const element = await page.$(config.carbon.imageQuerySelector);
  const image = await element.screenshot();
  await page.close();

  res.setHeader("Content-Type", "image/png");
  res.statusCode = 200;
  res.end(image);
};
