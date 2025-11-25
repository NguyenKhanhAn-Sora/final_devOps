import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("User API", () => {
  const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "123456",
  };

  let accessToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });

    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get user profile", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("email", testUser.email);
    expect(res.body.user).toHaveProperty("id");
  });

  it("should update user profile", async () => {
    const updatedData = {
      name: "Updated Name",
      email: testUser.email,
    };

    const res = await request(app)
      .put("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("name", updatedData.name);
  });
});
