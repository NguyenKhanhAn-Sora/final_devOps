import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Comment } from "../../models/Comment";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Comment API", () => {
  const testUser = {
    name: "Test User",
    email: "testcomment@example.com",
    password: "123456",
  };

  let accessToken: string;
  let testImageId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await Comment.deleteMany({});
    await Image.deleteMany({});
    await User.deleteMany({ email: testUser.email });

    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.accessToken;

    const user = await User.findOne({ email: testUser.email });
    const testImage = new Image({
      user: user?._id,
      imageUrl: "http://example.com/test.jpg",
      publicId: "test123",
      description: "Test image",
      visibility: "public",
      status: "approved",
    });
    const savedImage: any = await testImage.save();
    testImageId = savedImage._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should post a comment successfully", async () => {
    const commentData = {
      content: "This is a test comment",
    };

    const res = await request(app)
      .post(`/api/comments/${testImageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(commentData);

    expect(res.statusCode).toBe(201);
    expect(res.body.comment).toHaveProperty("content", commentData.content);
    expect(res.body.comment).toHaveProperty("image", testImageId);
  });

  it("should post another comment successfully", async () => {
    const commentData = {
      content: "Another test comment",
    };

    const res = await request(app)
      .post(`/api/comments/${testImageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(commentData);

    expect(res.statusCode).toBe(201);
    expect(res.body.comment).toHaveProperty("content", commentData.content);
  });
});
