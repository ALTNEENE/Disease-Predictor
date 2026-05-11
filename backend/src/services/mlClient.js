const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 120000
});

function mlError(error) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  const status = error.response?.status;
  const message = detail ? `ML service error${status ? ` (${status})` : ""}: ${detail}` : error.message;
  const wrapped = new Error(message);
  wrapped.statusCode = status >= 400 && status < 500 ? 400 : 502;
  return wrapped;
}

async function request(fn) {
  try {
    return await fn();
  } catch (error) {
    throw mlError(error);
  }
}

function fileForm(filePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  return form;
}

async function analyzeDataset(filePath) {
  const form = fileForm(filePath);
  const { data } = await request(() => client.post("/datasets/analyze", form, { headers: form.getHeaders() }));
  return data;
}

async function trainModel(filePath, payload = {}) {
  const form = fileForm(filePath);
  ["target_disease", "target_cases", "target_deaths", "model_name"].forEach((key) => {
    if (payload[key]) form.append(key, payload[key]);
  });
  const { data } = await request(() =>
    client.post("/models/train", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    })
  );
  return data;
}

async function predict(modelId, features) {
  const { data } = await request(() => client.post("/predict", { model_id: modelId, features }));
  return data;
}

async function getTree(modelId) {
  const { data } = await request(() => client.get(`/models/${modelId}/tree`));
  return data;
}

module.exports = {
  analyzeDataset,
  trainModel,
  predict,
  getTree
};
