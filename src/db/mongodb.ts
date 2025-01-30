import mongoose, { model, Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
});

const contentSchema = new Schema({
  type: String,
  title: String,
  link: String,
  // tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  tags: [String],
  favourite: Boolean,
  disableCard: Boolean,
  createdAt: String,
  updatedAt: String,
  userId: { type: mongoose.Types.ObjectId, ref: "User", require: true },
});

const tagSchema = new Schema({
  tagList: [String],
  userId: { type: mongoose.Types.ObjectId, ref: "User", require: true },
  contentId: {
    type: mongoose.Types.ObjectId,
    ref: "Content",
    require: true,
    unique: true,
  },
});

const linkSchema = new Schema({
  hash: String,
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    require: true,
    unique: true,
  },
});

export const UserModel = model("User", userSchema);
export const ContentModel = model("Content", contentSchema);
export const linkModel = model("Link", linkSchema);
export const TagModel = model("Tags", tagSchema);