// PM2 konfigurace pro spuštění API na serveru
module.exports = {
  apps: [
    {
      name: "procamp-api",
      script: "./apps/api/dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
