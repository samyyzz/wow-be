import express from "express";
import { ContentModel, linkModel, UserModel } from "./db/mongodb";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "./config";
import { userMiddleware } from "./auth/middleware";
import { hashMyPassword, shareThisHash } from "./utils";
import cors from "cors";
import z from "zod";

const app = express();
app.use(express.json());
app.use(cors());

const UserZodSchema = z.object({
  name: z.string().min(3).max(20),
  email: z.string().email().max(20),
  password: z.string().min(3).max(20),
});

const ContentZodSchema = z.object({
  type: z.string(),
  title: z.string(),
  link: z.string(),
  tags: z.string().array(),
  favourite: z.boolean(),
  disableCard: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
})

app.get("/", (req, res) => {
  res.json({ message: "Server working. OK !" });
});

//POST : Signup
app.post("/api/v1/signup", async (req, res) => {
  const { name, password, email } = req.body;
  if (name && email && password) {
    const parsedBody = UserZodSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res
        .status(401)
        .send({ message: "User sent wrong body format, failed to parse !" });
    }
    try {
      await UserModel.create({
        name: name,
        email: email,
        password: hashMyPassword(password), //might throw error as generating pass while adding to db
      });
      const userInDb = await UserModel.findOne({ email });
      const token = jwt.sign(
        {
          id: userInDb?._id,
        },
        SECRET_KEY
      );

      res.status(201).json({ message: "User signup-up successfully !", token });
    } catch (e) {
      res.status(411).json({ message: "User already exist, Failed !" });
    }
  } else {
    res.status(401).send({ message: "User sent incomplete body !" });
  }
});

//POST : Login
app.post("/api/v1/signin", async (req, res) => {
  const { password, email } = req.body;
  if (email && password) {
    const parsedBody = UserZodSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(401).send({ message: "User sent wrong body format, failed to parse !" });
    }
    try {
      const userInDb = await UserModel.findOne({ email });
      console.log("userInDb :", userInDb);
      const generatedHash = await hashMyPassword(password);
      if (!generatedHash) {
        res.status(411).json({ message: "Failed to generate hash !" });
      }
        if (userInDb?.password === generatedHash) {
          const token = jwt.sign(
            {
              id: userInDb?._id,
            },
            SECRET_KEY
          );
          res.status(201).json({ message: "User login successfully !", token });
        } else {
          res.status(411).json({ message: "Invalid Password, hash mismatched !" });
        }
      }catch (error) {
      res.status(411).json({ message: "User not found, Failed !", error });
    }
  } else {
    res.status(401).send({ message: "User sent incomplete body !" });
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

  //might fail after adding zodSchema // check ContentZodSchema validation
  const parsedContent = ContentZodSchema.safeParse(req.body) 
  
  if(!parsedContent.success){
    res.status(401).json({message: "Failed to parse req body"})
  }

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

  const parsedBody = ContentZodSchema.safeParse({contentId,disable})
  if(!parsedBody.success){
    res.status(404).json({ messag: "Failed to validate, incorrect format" });
  }

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
  } catch (error) {
    res.status(404).json({ messag: "Failed to update !", error });
  }
});

//PUT: Add/remove fav when clienClickOnLikeBtn
app.put("/api/v1/content/:contentId", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  const fav = req.body.favourite;

  const parsedBody = ContentZodSchema.safeParse({contentId, fav})
  if(!parsedBody.success){
    res.status(404).json({ messag: "Failed to validate, incorrect format" });
  }

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
  } catch (error) {
    res.status(404).json({ messag: "Failed to update !", error });
  }
});

//POST: generate public share link hash
app.post("/api/v1/wow/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  
  const parsedBody = ContentZodSchema.safeParse({share})
  if(!parsedBody.success){
    res.status(404).json({ messag: "Failed to validate, incorrect format" });
  }

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
