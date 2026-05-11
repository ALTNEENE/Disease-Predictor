const express = require("express");
const { authenticate } = require("../middleware/auth");
const { trainModel, listModels, getModel, predict, getTree } = require("../controllers/modelController");

const router = express.Router();

router.use(authenticate);
router.post("/train", trainModel);
router.get("/", listModels);
router.get("/:id", getModel);
router.get("/:id/tree", getTree);
router.post("/predict", predict);

module.exports = router;
