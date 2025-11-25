import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Like } from "../../models/Like";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Like API", () => {
  const testUser = {
    name: "Test User",
    email: "testlike@example.com",
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
    await Like.deleteMany({});
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

  it("should like an image", async () => {
    const res = await request(app)
      .post(`/api/likes/${testImageId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("liked", true);
  });

  it("should unlike an image when liked again", async () => {
    await request(app)
      .post(`/api/likes/${testImageId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .post(`/api/likes/${testImageId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("liked", false);
  });
});
