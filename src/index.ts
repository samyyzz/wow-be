import "dotenv/config";
import express from "express";
import cors from "cors";
import { userRouter } from "./routes/user";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userRouter);

async function main() {
  const connectArgs = {
    uri: process.env.MONGO_CONNECTION_URL,
  };
  if (connectArgs.uri) {
    await mongoose.connect(connectArgs.uri);
    console.log("DB connected Successfully !");
  } else {
    console.log("Failed to connect to DB :", connectArgs.uri);
  }

  app.listen(3000, () => {
    console.log("Server is running on port :", 3000);
  });
}

main();
