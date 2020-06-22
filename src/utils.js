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
  widthAdjustment: true,
  windowControls: true,
  windowTheme: "none",
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
  theme: "t",
  watermark: "wm",
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
  "width",

  // add support
  "selectedLines",
];

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

    const type = typeof body[option];
    const expectedType = typeof defaultOptions[option];

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
    const queryParam = [optionToQueryParam[key]];
    const value = mergedOptions[key];
    return `${acc}&${queryParam}=${encodeURIComponent(value)}`;
  }, "?");
};

module.exports = {
  createSearchString,
  defaultOptions,
  validateBody,
};
