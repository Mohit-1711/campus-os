const express = require("express");
const { listAllFiles } = require("../controllers/fileControllers");

const router = express.Router();

router.get("/", listAllFiles);

module.exports = router;
