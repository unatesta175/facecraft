const path = require("path");

const root = path.join(__dirname, "../..");

module.exports = {
  apps: [
    {
      name: "facecraft-api",
      cwd: path.join(root, "apps/api"),
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "facecraft-web",
      cwd: path.join(root, "apps/web"),
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
