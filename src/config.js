const config = {
  server: {
    host: process.env.HOST || "localhost",
    port: process.env.PORT || "3000",
    protocol: process.env.PROTOCOL || "http",
  },
  carbon: {
    url: "https://carbon.now.sh/",
    imageQuerySelector: "#export-container  .container-bg",
  },
};

module.exports = config;
