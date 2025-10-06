import express from "express";
import {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
} from "../controller/template.controller.js";

const router = express.Router();

router.get("/getallTemplates", getTemplates);
router.get("/:id", getTemplateById); 
router.post("/add", addTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
