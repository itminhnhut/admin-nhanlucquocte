module.exports = {
  apps: [
    {
      name: "admin-nhanlucquocte-frontend",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 4001",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4001,
      },
    },
  ],
};
