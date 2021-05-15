import { app } from "../app";
import request from "supertest";

import { createConnection } from "../database";
import { Connection } from "typeorm";

let connection: Connection;

describe("Create User Controller", () => {


 beforeAll(async () => {
  connection = await createConnection();
  await connection.runMigrations();
 })

 afterAll(async () => {
  connection.dropDatabase();
  connection.close();
 })

 it("Should be able create a new User", async () => {

  const response = await request(app).post("/api/v1/users").send({
   name: "test",
   email: "teste@test.com",
   password: "12345"
  })

  console.log(response.body)
  expect(response.status).toBe(201)
 })
})