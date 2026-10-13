import request from "supertest";
import { app } from "../app";

describe("authentication API", () => {
  it("creates an account and returns a JWT", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "Acme Brand",
      email: "brand@example.com",
      password: "secure-password",
      role: "brand",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: "brand@example.com", role: "brand" });
  });
});
