import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Image API", () => {
  const testUser = {
    name: "Test User",
    email: "testimage@example.com",
    password: "123456",
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    await Image.deleteMany({});

    await request(app).post("/api/auth/register").send(testUser);
    const user = await User.findOne({ email: testUser.email });

    const image1 = new Image({
      user: user?._id,
      imageUrl: "http://example.com/public1.jpg",
      publicId: "public1",
      description: "Public Image 1",
      visibility: "public",
      status: "approved",
    });

    const image2 = new Image({
      user: user?._id,
      imageUrl: "http://example.com/public2.jpg",
      publicId: "public2",
      description: "Public Image 2",
      visibility: "public",
      status: "approved",
    });

    const image3 = new Image({
      user: user?._id,
      imageUrl: "http://example.com/private.jpg",
      publicId: "private1",
      description: "Private Image",
      visibility: "private",
      status: "approved",
    });

    const image4 = new Image({
      user: user?._id,
      imageUrl: "http://example.com/pending.jpg",
      publicId: "pending1",
      description: "Pending Image",
      visibility: "public",
      status: "pending",
    });

    await Promise.all([
      image1.save(),
      image2.save(),
      image3.save(),
      image4.save(),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get only public approved images", async () => {
    const res = await request(app).get("/api/images/public");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("images");
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images.length).toBe(2);

    res.body.images.forEach((img: any) => {
      expect(img.visibility).toBe("public");
      expect(img.status).toBe("approved");
    });
  });
});
