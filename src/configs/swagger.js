const swaggerJsdoc = require("swagger-jsdoc");

// Common configuration for both versions
const commonDefinition = {
  openapi: "3.0.0",
  servers: [
    {
      url: "http://localhost:8080",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// V1 API Specification
const v1Options = {
  definition: {
    ...commonDefinition,
    info: {
      title: "Future Key API v1",
      version: "1.0.0",
      description: "API documentation for Future Key v1 - Admin page",
    },
  },
  apis: ["./src/routes/*.js", "./src/apis/v1/routes/**/*.js"],
};

// V2 API Specification
const v2Options = {
  definition: {
    ...commonDefinition,
    info: {
      title: "Future Key API v2",
      version: "2.0.0",
      description: "API documentation for Future Key v2 - New features",
    },
  },
  apis: ["./src/apis/v2/routes/**/*.js"],
};

const swaggerSpecV1 = swaggerJsdoc(v1Options);
const swaggerSpecV2 = swaggerJsdoc(v2Options);

module.exports = {
  v1: swaggerSpecV1,
  v2: swaggerSpecV2,
};
