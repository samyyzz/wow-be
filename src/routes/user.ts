import express from "express"
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
  UserZodSchema,
} from "../zod/zodSchema";

export const userRouter = express.Router()

//POST : Signup
userRouter.post("/signup", async (req, res) => {
    const { name, password, email } = req.body;
    if (name && email && password) {
      const parsedBody = UserZodSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res
          .status(401)
          .send({ message: "User sent wrong body format, failed to parse !" });
      }
      const hashedPass = await hashMyPassword(password);
    //   console.log(name, email, password, hashedPass);
      try {
        await UserModel.create({
          name: name,
          email: email,
          password: hashedPass, //might throw error as generating pass while adding to db
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
  userRouter.post("/signin", async (req, res) => {
    const { password, email } = req.body;
    if (email && password) {
      const parsedBody = UserZodSchema.safeParse(req.body);
    //   console.log("parsedBody :", parsedBody, parsedBody.error);
      if (!parsedBody.success) {
        res
          .status(401)
          .send({ message: "User sent wrong body format, failed to parse !" });
      }
      try {
        const userInDb = await UserModel.findOne({ email });
        // console.log("userInDb :", userInDb);
        const generatedHash = await hashMyPassword(password);
        // console.log("generatedHash :", generatedHash);
        if (!generatedHash) {
          res.status(411).json({ message: "Failed to generate hash !" });
        }
        const passwordHashmatched = await bcrypt.compare(password, generatedHash);
        // console.log("passwordHashmatched :", passwordHashmatched);
  
        if (!passwordHashmatched) {
          res.status(411).json({ message: "Invalid Password, hash mismatched !" });
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
    // console.log("addedContent :", {
    //   type,
    //   title,
    //   link,
    //   tags,
    //   favourite,
    //   disableCard,
    //   createdAt,
    //   updatedAt,
    //   userId
    // });
  
    //might fail after adding zodSchema // check ContentZodSchema validation
    const parsedContent = ContentZodSchema.safeParse({...req.body, userId});
    // console.log(parsedContent.data)
  
    if (!parsedContent.success) {
    //   console.log(" parsedContent.error :", parsedContent.error)
      res.status(401).json({ message: "Failed to parse req body"});
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
      res.status(411).json({ message: "Failed to add content !",error });
    }
  });
  
  //GET : fetch all Contents of a User
  userRouter.get("/content", userMiddleware, async (req, res) => {
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
  userRouter.put("/content", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;
    const disable = req.body.disableCard;
  
    const parsedBody = disableContentZodSchema.safeParse({ contentId, disable });
    if (!parsedBody.success) {
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
  userRouter.put("/content/:contentId", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;
    const fav = req.body.favourite;
  
    const parsedBody = favContentZodSchema.safeParse({ contentId, fav });
    if (!parsedBody.success) {
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
  userRouter.post("/wow/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
  
    const parsedBody = share as boolean
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
  