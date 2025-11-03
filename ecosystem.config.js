module.exports = {
  apps: [
    {
      name: "future-key-api",
      script: "server.js",
      cron_restart: "0 */24 * * *",
      args: "one two",
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: ["node_modules", "logs"],
      watch_options: {
        followSymlinks: false,
      },
      max_memory_restart: "1G",
    },
  ],
};
