import express from "express";
import { ContentModel, linkModel, UserModel } from "./db/mongodb";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "./config";
import { userMiddleware } from "./middleware";
import { shareThisHash } from "./utils";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/me", (req, res) => {
  res.json({ message: "Server working. OK !" });
});

app.post("/api/v1/signup", async (req, res) => {
  //Todo:  zod, jwt, pass hashing
  const { name, password, email } = req.body;
  try {
    await UserModel.create({
      name: name,
      email: email,
      password: password,
    });
    const foundMyUser = await UserModel.findOne({
      email,
      password,
    });
    console.log("foundMyUser :", foundMyUser);
    const token = jwt.sign(
      {
        id: foundMyUser?._id,
      },
      SECRET_KEY
    );

    res.status(201).json({ message: "User signup-up successfully !", token });
  } catch (e) {
    res.status(411).json({ message: "User already exist, Failed !" });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { email, password } = req.body;
  const userAlreadyExist = await UserModel.findOne({
    email,
    password,
  });
  if (userAlreadyExist) {
    const token = jwt.sign(
      {
        id: userAlreadyExist._id,
      },
      SECRET_KEY
    );
    res.json({ token: token });
  } else {
    res.status(403).json({
      message: "Incorrect Credentials or user not found !",
      //@ts-ignore
      userId: req.userId,
    });
  }
});

//POST: Add User Content
app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const {
    type,
    title,
    link,
    tags,
    favourite,
    disableCard,
    createdAt,
    updatedAt,
  } = req.body;

  //@ts-ignore
  const userId = req.userId;

  if (!userId) {
    res.status(404).json({ messag: "User is not authneticated" });
  }
  console.log("addedContent :", {
    type,
    title,
    link,
    tags,
    favourite,
    disableCard,
    createdAt,
    updatedAt,
  });
  try {
    await ContentModel.create({
      type,
      title,
      link,
      tags,
      favourite,
      disableCard,
      createdAt,
      updatedAt,
      userId,
    });
    res.json({ message: "Content added !" });
  } catch (error) {
    res.status(411).json({ message: "Failed to add content !" });
  }
});

//GET : fetch all Contents of a User
app.get("/api/v1/content", userMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.userId;
  if (!userId) {
    res.status(404).json({ messag: "User is not authneticated" });
  }
  try {
    const content = await ContentModel.find({
      userId: userId,
    }).populate("userId", "name");
    res.json({ content });
  } catch (error) {
    res.status(411).json({ message: "Failed to fetch Content Data" });
  }
});

//PUT: disable Content card on clientdeletionOfCard
app.put("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  const disable = req.body.disableCard;

  ///@ts-ignore
  const userId = req.userId;
  if (!userId) {
    res.status(404).json({ messag: "User is not authneticated" });
  }
  try {
    const disblededCard = await ContentModel.updateOne(
      {
        _id: contentId,
        userId: userId,
      },
      {
        $set: {
          disableCard: disable,
        },
      },
      {
        new: true,
      }
    );
    res.json({ message: "Card Deleted !", deletedCard: disblededCard });
  } catch (error) {}
});

//PUT: Add/remove fav when clienClickOnLikeBtn
app.put("/api/v1/content/:contentId", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  const fav = req.body.favourite;
  ///@ts-ignore
  const userId = req.userId;
  try {
    const favUpdatedCard = await ContentModel.updateOne(
      {
        _id: contentId,
        userId: userId,
      },
      {
        $set: {
          favourite: fav,
        },
      },
      {
        new: true,
      }
    );
    res.json({ message: "Card Deleted !", UpdatedCard: favUpdatedCard });
  } catch (error) {}
});

//POST: generate public share link hash
app.post("/api/v1/wow/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  if (share) {
    const linkAlreadyExist = await linkModel.findOne({
      //@ts-ignore
      userId: req.useId,
    });
    if (linkAlreadyExist) {
      res.json({
        // hash: generatedHash,
        messgae: "Link/hash already exist :" + linkAlreadyExist.hash,
      });
      return;
    }
    const generatedHash = shareThisHash(20);
    const createdLink = await linkModel.create({
      hash: generatedHash,
      //@ts-ignore
      userId: req.userId,
    });
    res.json({
      hash: generatedHash,
      createdLink: createdLink,
    });
  } else {
    await linkModel.deleteOne({
      //@ts-ignore
      userId: req.userId,
    });
    res.json({ message: "hash to share url hash REMOVED !" });
  }
});

app.get("/api/v1/wow/:shareLink", async (req, res) => {
  const hashFromParams = req.params.shareLink;
  const link = await linkModel.findOne({ hash: hashFromParams });
  if (link) {
    const content = await ContentModel.find({
      userId: link.userId,
    });
    const user = await UserModel.findOne({
      _id: link.userId,
    });
    if (!user) {
      res.status(411).json({ message: "User not-found inside req.userId" });
    }
    res.json({
      User: user,
      Content: content,
    });
  } else {
    res
      .status(411)
      .json({ message: "Incorrect hash, or link might expired !" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port :", 3000);
});
