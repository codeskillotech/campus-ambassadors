import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    caption: { type: String },
    imageUrl: { type: String },
    tags: { type: [String] },
  },
  { timestamps: true }
);

export default mongoose.model("Template", templateSchema);
