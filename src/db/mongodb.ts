import mongoose, { model, Schema, Types } from "mongoose";
import { boolean } from "zod";

const connectArgs = {
  uri: "mongodb+srv://ranjansameer89:QIU3ZTsrPa5bVSAP@wowcluster.a2caw.mongodb.net/wow",
};

mongoose.connect(connectArgs.uri);

const userSchema = new Schema({
  name: { type: String },
  // username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
});

const contentSchema = new Schema({
  type: String,
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
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

// const favSchema = new Schema({
//   userId: {
//     type: mongoose.Types.ObjectId,
//     ref: "User",
//     require: true,
//     unique: true,
//   },
//   contentId: [
//     {
//       type: mongoose.Types.ObjectId,
//       ref: "Content",
//       require: true,
//       unique: true,
//     },
//   ], //favourite = true
// });

// const dustbinSchema = new Schema({
//   userId: {
//     type: mongoose.Types.ObjectId,
//     ref: "User",
//     require: true,
//     unique: true,
//   },
//   contentId: [
//     {
//       type: mongoose.Types.ObjectId,
//       ref: "Content",
//       require: true,
//       unique: true,
//     },
//   ], //disableCard = true
// });

export const UserModel = model("User", userSchema);
export const ContentModel = model("Content", contentSchema);
export const linkModel = model("Link", linkSchema);
export const TagModel = model("Tags", tagSchema);
// export const FavouriteModel = model("Tags", favSchema);
// export const DustbinModel = model("Tags", dustbinSchema);
