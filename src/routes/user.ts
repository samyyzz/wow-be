import express from "express";
import { ContentModel, linkModel, UserModel } from "../db/mongodb";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";
import { userMiddleware } from "../auth/middleware";
import { hashMyPassword, shareThisHash } from "../utils";
import bcrypt from "bcrypt";
import {
  ContentZodSchema,
  disableContentZodSchema,
  favContentZodSchema,
  UserSignupZodSchema,
  UserLoginZodSchema,
} from "../zod/zodSchema";

export const userRouter = express.Router();

//POST : Signup
userRouter.post("/create", async (req, res) => {
  const { name, password, email } = req.body;
  console.log(req.body)
  const newUser = await UserModel.create({
    name: name,
    email: email,
    password: password, //might throw error as generating pass while adding to db
  });
  const token = jwt.sign(
    {
      id: newUser?._id,
    },
    SECRET_KEY
  );

  res
    .status(201)
    .json({ message: "User signup-up successfully !", newUser, token });
});

userRouter.post("/signup", async (req, res) => {
  const { name, password, email } = req.body;
  if (name && email && password) {
    const parsedBody = UserSignupZodSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res
        .status(401)
        .send({ message: "User sent wrong body format, failed to parse !" });
    }
    const hashedPass = await hashMyPassword(password);
    console.log(name, email, password, hashedPass);
    try {
      const newUser = await UserModel.create({
        name: name,
        email: email,
        password: hashedPass, //might throw error as generating pass while adding to db
      });
      if (!newUser) return console.log("newUser :", newUser);
      // const userInDb = await UserModel.findOne({ email });
      const token = jwt.sign(
        {
          id: newUser?._id,
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
userRouter.post("/signin", async (req, res) => {
  const { password, email } = req.body;
  if (email && password) {
    const parsedBody = UserLoginZodSchema.safeParse(req.body);
    console.log("parsedBody :", parsedBody, parsedBody.error);
    if (!parsedBody.success) {
      res
        .status(401)
        .send({ message: "User sent wrong body format, failed to parse !" });
    }
    try {
      const userInDb = await UserModel.findOne({ email });
      const generatedHash = await hashMyPassword(password);
      if (!generatedHash) {
        res.status(411).json({ message: "Failed to generate hash !" });
      }
      const passwordHashmatched = await bcrypt.compare(password, generatedHash);
      if (!passwordHashmatched) {
        res
          .status(411)
          .json({ message: "Invalid Password, hash mismatched !" });
      }
      const token = jwt.sign(
        {
          id: userInDb?._id,
        },
        SECRET_KEY
      );
      res.status(201).json({ message: "User login successfully !", token });
    } catch (error) {
      res.status(411).json({ message: "User not found, Failed !", error });
    }
  } else {
    res.status(401).send({ message: "User sent incomplete body !" });
  }
});

//POST: Add User Content
userRouter.post("/content", userMiddleware, async (req, res) => {
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

  //might fail after adding zodSchema // check ContentZodSchema validation
  const parsedContent = ContentZodSchema.safeParse({ ...req.body, userId });
  if (!parsedContent.success) {
    res.status(401).json({ message: "Failed to parse req body" });
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
    res.status(411).json({ message: "Failed to add content !", error });
  }
});

//GET : fetch all Contents of a User
userRouter.get("/myContents", userMiddleware, async (req, res) => {
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
userRouter.put("/disableContent", userMiddleware, async (req, res) => {
  const { contentId, disable } = req.body;

  ///@ts-ignore
  const userId = req.userId;
  if (!userId) {
    res.status(404).json({ messag: "User is not authneticated" });
  }

  const parsedBody = disableContentZodSchema.safeParse({ contentId, disable });
  console.log("after-before ;", parsedBody);

  console.log(parsedBody);
  if (!parsedBody.success) {
    res.status(404).json({ messag: "Failed to validate, incorrect format" });
  }

  try {
    const disblededCard = await ContentModel.findOneAndUpdate(
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
userRouter.put("/favContent", userMiddleware, async (req, res) => {
  const { contentId, fav } = req.body;
  console.log(contentId, fav);

  ///@ts-ignore
  const userId = req.userId;
  console.log(userId);
  if (!userId) {
    res.status(404).json({ messag: "User is not authneticated" });
  }
  const parsedBody = favContentZodSchema.safeParse({ contentId, fav });
  console.log("before-fail:", parsedBody);
  console.log(parsedBody);
  if (!parsedBody.success) {
    console.log("after-fail ;", parsedBody.error);
    res.status(404).json({ messag: "Failed to validate, incorrect format" });
  }

  try {
    const favUpdatedCard = await ContentModel.findOneAndUpdate(
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
    res.json({
      message: "Added to favourites successfully !",
      UpdatedCard: favUpdatedCard,
    });
  } catch (error) {
    res.status(404).json({ message: "Failed to update !", error });
  }
});

//POST: generate public share link hash
userRouter.post("/wow/share", userMiddleware, async (req, res) => {
  const share = req.body.share;

  const parsedBody = share as boolean;
  if (typeof parsedBody !== share) {
    res.status(404).json({ messag: "share/req.body is not of type boolean" });
  }

  if (parsedBody) {
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

//GET: use this generated-link to access someones else card
userRouter.get("/wow/:shareLink", async (req, res) => {
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
