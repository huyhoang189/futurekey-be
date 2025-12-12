const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./configs/swagger");
const logger = require("./loggers");
const pagination = require("./middlewares/validation/pagination");
const checkHealth = require("./middlewares/handler/checkHealth");
const router = require("./routes");

//init app
const app = express();

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(pagination);

app.use(cors());

// Swagger documentation with multiple API versions
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: "/api-docs/v1/swagger.json",
        name: "API v1",
      },
      {
        url: "/api-docs/v2/swagger.json",
        name: "API v2",
      },
    ],
    persistAuthorization: true, // Giữ token khi reload trang
  },
};

// Serve Swagger JSON specs
app.get("/api-docs/v1/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpecs.v1);
});

app.get("/api-docs/v2/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpecs.v2);
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

app.get("/", checkHealth);

app.use("/api", router);

app.use((err, req, res, next) => {
  res.status(500).json({ message: "FINAL ERROR", error: err.message });
});

module.exports = app;
