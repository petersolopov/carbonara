const { env } = process;

const config = {
  server: {
    host: env.HOST || "localhost",
    port: env.PORT || "3000",
    protocol: env.PROTOCOL || "http",
  },
  carbon: {
    url: env.CARBON_URL || "https://carbon.now.sh/",
    imageQuerySelector:
      env.CARBON_IMG_SELECTOR || "#export-container  .container-bg",
  },
};

module.exports = config;
