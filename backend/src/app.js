const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const env = require("./config/env");
const routes = require("./routes");
const ensureDatabase = require("./middleware/database");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const corsOrigins = env.clientUrl ? env.clientUrl.split(",").map((origin) => origin.trim()).filter(Boolean) : [];
const allowAllOrigins = corsOrigins.includes("*");

app.use(helmet());
app.use(cors({ origin: allowAllOrigins ? "*" : corsOrigins.length ? corsOrigins : false, credentials: !allowAllOrigins }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(ensureDatabase);
app.use("/api", routes);
app.use("/", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
