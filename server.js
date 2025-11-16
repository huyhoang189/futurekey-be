const app = require("./src/app");
const {
  api: { port },
} = require("./src/configs");

const server = app.listen(port, () => {
  console.log(`Ecommerce start with adress http://localhost:${port}`);
});

process.on("SIGINT", () => {
  server.close(() => console.log("Exit server express!"));
});
