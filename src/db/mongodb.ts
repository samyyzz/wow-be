import mongoose, { model, Schema } from "mongoose";

const connectArgs = {
  uri: "mongodb+srv://ranjansameer89:QIU3ZTsrPa5bVSAP@wowcluster.a2caw.mongodb.net/wow",
};

mongoose.connect(connectArgs.uri);

const userSchema = new Schema({
  name: { type: String },
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
});
const contentSchema = new Schema({
  type: String,
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", require: true },
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
