const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");
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

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", checkHealth);

app.use("/api", router);

app.use((err, req, res, next) => {
  res.status(500).json({ message: "FINAL ERROR", error: err.message });
});

module.exports = app;
