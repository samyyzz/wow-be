"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("./db/mongodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/me", (req, res) => {
    res.json({ message: "Server working. OK !" });
});
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Todo:  zod, jwt, pass hashing
    const { name, username, password, email } = req.body;
    try {
        yield mongodb_1.UserModel.create({
            name: name,
            username: username,
            email: email,
            password: password,
        });
        const foundMyUser = yield mongodb_1.UserModel.findOne({
            email,
            password,
        });
        console.log("foundMyUser :", foundMyUser);
        const token = jsonwebtoken_1.default.sign({
            id: foundMyUser === null || foundMyUser === void 0 ? void 0 : foundMyUser._id,
        }, config_1.SECRET_KEY);
        res.status(201).json({ message: "User signup-up successfully !", token });
    }
    catch (e) {
        res.status(411).json({ message: "Username already exist, Failed !" });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const userAlreadyExist = yield mongodb_1.UserModel.findOne({
        email,
        password,
    });
    if (userAlreadyExist) {
        const token = jsonwebtoken_1.default.sign({
            id: userAlreadyExist._id,
        }, config_1.SECRET_KEY);
        res.json({ token: token });
    }
    else {
        res.status(403).json({
            message: "Incorrect Credentials or user not found !",
            //@ts-ignore
            userId: req.userId,
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, tags, title, type } = req.body;
    console.log("link :", link);
    yield mongodb_1.ContentModel.create({
        link,
        tags: [],
        title,
        type,
        //@ts-ignore
        userId: req.userId,
    });
    res.json({ message: "Content added !" });
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const content = yield mongodb_1.ContentModel.find({
        userId: userId,
    }).populate("userId", "username");
    res.json(content); // {content} or content ?
}));
app.put("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, link, tags, contentId, type } = req.body;
    //@ts-ignore
    const userId = req.userId;
    const updatedContent = yield mongodb_1.ContentModel.updateOne({
        contentId,
        userId,
    }, {
        title,
        link,
        tags,
        userId,
        type,
    });
    res.json({ message: "Updated successfully", updatedContent });
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    try {
        const deletedContent = yield mongodb_1.ContentModel.findByIdAndDelete({
            _id: contentId
            // //@ts-ignore
            // userId: req.userId,
        });
        res.json({ message: "deleted !", deletedContent });
    }
    catch (e) {
        res.status(411).json({ message: "Failed to delete ", });
    }
}));
//generate public share link hash
app.post("/api/v1/wow/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const linkAlreadyExist = yield mongodb_1.linkModel.findOne({
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
        const generatedHash = (0, utils_1.shareThisHash)(20);
        const createdLink = yield mongodb_1.linkModel.create({
            hash: generatedHash,
            //@ts-ignore
            userId: req.userId,
        });
        res.json({
            hash: generatedHash,
            createdLink: createdLink,
        });
    }
    else {
        yield mongodb_1.linkModel.deleteOne({
            //@ts-ignore
            userId: req.userId,
        });
        res.json({ message: "hash to share url hash REMOVED !" });
    }
}));
app.get("/api/v1/wow/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hashFromParams = req.params.shareLink;
    const link = yield mongodb_1.linkModel.findOne({ hash: hashFromParams });
    if (link) {
        const content = yield mongodb_1.ContentModel.find({
            userId: link.userId,
        });
        const user = yield mongodb_1.UserModel.findOne({
            _id: link.userId,
        });
        if (!user) {
            res.status(411).json({ message: "User not-found inside req.userId" });
        }
        res.json({
            User: user,
            Content: content,
        });
    }
    else {
        res
            .status(411)
            .json({ message: "Incorrect hash, or link might expired !" });
    }
}));
app.listen(3000, () => {
    console.log("Server is running on port :", 3000);
});
