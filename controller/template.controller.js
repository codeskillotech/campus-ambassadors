import Template from "../model/template.model.js";

// Get all templates (with optional tag + search filters)
export const getTemplates = async (req, res) => {
  try {
    const { tag, search } = req.query;

    let filter = {};

    // If tag filter is applied (and not "All")
    if (tag && tag !== "All") {
      filter.tags = { $in: [tag] };
    }

    // If search filter is applied (title or caption)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { caption: { $regex: search, $options: "i" } }
      ];
    }

    const templates = await Template.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new template
export const addTemplate = async (req, res) => {
  try {
    const { title, caption, imageUrl, tags } = req.body;
    const newTemplate = new Template({
      title,
      caption,
      imageUrl,
      tags: tags?.split(",").map((t) => t.trim()) || [],
    });
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const deleted = await Template.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
