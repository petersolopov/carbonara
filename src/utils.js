const getRawBody = require("raw-body");
const formidable = require("formidable");
const prettier = require("prettier");

const defaultOptions = {
  backgroundColor: "rgba(171, 184, 195, 1)",
  code: "",
  dropShadow: true,
  dropShadowBlurRadius: "68px",
  dropShadowOffsetY: "20px",
  exportSize: "2x",
  fontFamily: "Hack",
  firstLineNumber: 1,
  fontSize: "14px",
  language: "auto",
  lineHeight: "133%",
  lineNumbers: false,
  paddingHorizontal: "56px",
  paddingVertical: "56px",
  squaredImage: false,
  theme: "seti",
  watermark: false,
  width: 536,
  widthAdjustment: true,
  windowControls: true,
  windowTheme: "none",
  prettify: false,
};

const optionToQueryParam = {
  backgroundColor: "bg",
  code: "code",
  dropShadow: "ds",
  dropShadowBlurRadius: "dsblur",
  dropShadowOffsetY: "dsyoff",
  exportSize: "es",
  fontFamily: "fm",
  firstLineNumber: "fl",
  fontSize: "fs",
  language: "l",
  lineHeight: "lh",
  lineNumbers: "ln",
  paddingHorizontal: "ph",
  paddingVertical: "pv",
  squaredImage: "si",
  selectedLines: "sl",
  theme: "t",
  watermark: "wm",
  width: "width",
  widthAdjustment: "wa",
  windowControls: "wc",
  windowTheme: "wt",
};

const ignoredOptions = [
  // options exist in exported config
  // there is not a possibility of pass it via url
  "backgroundImage",
  "backgroundImageSelection",
  "backgroundMode",
  "squaredImage",
  "hiddenCharacters",
  "name",
  "loading",
  "icon",
  "isVisible",

  // add support
  "selectedLines",

  "fontCustom",
];

const ContentTypeApplicationJson = "application/json";
const ContentTypeMultipartFormData = "multipart/form-data";

function detectRequestContentType(req) {
  const contentType = req.headers["content-type"];

  if (!contentType) {
    throw new Error("missing request content-type");
  }

  if (contentType.includes(ContentTypeApplicationJson)) {
    return ContentTypeApplicationJson;
  }
  if (contentType.includes(ContentTypeMultipartFormData)) {
    return ContentTypeMultipartFormData;
  }
  throw new Error("unable to find a request content type");
}

async function parseBody(req) {
  const contentType = detectRequestContentType(req);

  if (contentType == ContentTypeApplicationJson) {
    const rawBody = await getRawBody(req, {
      length: req.headers["content-length"],
      limit: "1mb",
      encoding: true,
    });
    return Promise.resolve(JSON.parse(rawBody));
  }

  if (contentType == ContentTypeMultipartFormData) {
    return new Promise((resolve, reject) => {
      const form = formidable({
        filter: () => false, // disable file upload
      });
      form.parse(req, (err, fields) => {
        if (err) {
          return reject(err);
        }
        const sanitizedFields = sanitizeFields(fields);
        resolve(sanitizedFields);
      });
    });
  }
  throw new Error("unknown request content type");
}

const sanitizeFields = (fields) => {
  const sanitizedFields = Object.entries(fields).map(([key, value]) => {
    const expectedType = typeof defaultOptions[key] || "string";
    return [key, sanitizeString(value, expectedType)];
  });

  return Object.fromEntries(sanitizedFields);
};

const sanitizeString = (value, type) => {
  if (type === "boolean") {
    return booleanizeString(value);
  } else if (type === "number") {
    return numberizeString(value);
  }

  return value;
};

const booleanizeString = (value) => {
  if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  }
  return value;
};

const numberizeString = (value) => {
  return parseInt(value);
};

const validateBody = (body) => {
  if (!body.code) {
    throw new Error("option 'code' is required");
  }

  Object.keys(body).forEach((option) => {
    if (ignoredOptions.includes(option)) {
      return;
    }

    if (!(option in defaultOptions)) {
      throw new Error(`unexpected option: '${option}'`);
    }

    const expectedType = typeof defaultOptions[option];
    const type = typeof body[option];

    if (type !== expectedType) {
      throw new Error(
        `option '${option}' has type '${type}', but '${expectedType}' expected`
      );
    }
  });
};

const createSearchString = (options) => {
  const mergedOptions = { ...defaultOptions, ...options };

  return Object.keys(mergedOptions).reduce((acc, key) => {
    const queryParam = optionToQueryParam[key];

    // some options do not exist in query string, like "prettify"
    if (!queryParam) {
      return acc;
    }

    const value = mergedOptions[key];
    return `${acc}&${queryParam}=${encodeURIComponent(value)}`;
  }, "?");
};

const prettifyCode = (code) => {
  try {
    // options like in carbon
    // https://github.com/carbon-app/carbon/blob/main/lib/util.js#L86
    return prettier.format(code, {
      semi: false,
      singleQuote: true,
      parser: "babel",
    });
  } catch {
    return code;
  }
};

module.exports = {
  createSearchString,
  defaultOptions,
  parseBody,
  validateBody,
  prettifyCode,
};
