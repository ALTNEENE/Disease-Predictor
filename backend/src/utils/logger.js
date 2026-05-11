const levels = ["debug", "info", "warn", "error"];

function write(level, message, meta = {}) {
  const payload = {
    time: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = levels.reduce((logger, level) => {
  logger[level] = (message, meta) => write(level, message, meta);
  return logger;
}, {});
