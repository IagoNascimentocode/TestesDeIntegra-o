import { Connection } from "typeorm";
import request from "supertest";
import createConnection from "../database";

import { app } from "../app";


let connection: Connection;

describe("Create User Controller", () => {

 beforeAll(async () => {
  connection = await createConnection();
  await connection.runMigrations();
 })

 afterAll(async () => {
  await connection.dropDatabase();
  await connection.close();
 })

 it("Should be able create a new User", async () => {

  const response = await request(app).post("/api/v1/users").send({
   name: "test",
   email: "teste@teste.com",
   password: "12345"
  })

  expect(response.status).toBe(201)
 })

 it("Should not be able to create a new user with existing email", async () => {

  const response = await request(app).post("/api/v1/users").send({
   name: "test2",
   email: "teste@teste.com",
   password: "12345"
  })

  expect(response.status).toBe(400);
  expect(response.body).toMatchObject({
   message: "User already exists"
  });
 });
});