import { Connection } from "typeorm";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import request from "supertest";


import authConfig from "../../config/auth";

import createConnection from "../../database";
import { app } from "../../app";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { hash } from "bcryptjs";
import { User } from "../../modules/users/entities/User";

let connection: Connection;
let token: string;
let user: User;

describe("Create statement", () => {

 beforeAll(async () => {
  connection = await createConnection();
  await connection.runMigrations();

  const usersRepository = new UsersRepository();

  user = await usersRepository.create({
   name: "Test",
   email: "test@test.com.br",
   password: await hash("test", 8)
  })

  const { secret, expiresIn } = authConfig.jwt;

  token = sign({ user }, secret, {
   subject: user.id,
   expiresIn
  })
 })

 afterAll(async () => {
  await connection.dropDatabase();
  await connection.close();
 })

 it("Should be bale to create a new statement as a deposit", async () => {
  const statement = {
   description: "Description to deposit",
   amount: 100
  }

  const response = await request(app)
   .post("/api/v1/statements/deposit")
   .set({
    Authorization: `Bearer ${token}`
   })
   .send({
    amount: statement.amount,
    description: statement.description
   })


  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
   id: expect.any(String),
   user_id: user.id,
   description: statement.description,
   amount: statement.amount,
   type: "deposit"
  });
 })

 it("Should be able to create a new statement as a withdraw", async () => {
  const statement = {
   description: "Description to withdraw",
   amount: 100
  }

  const response = await request(app)
   .post("/api/v1/statements/withdraw")
   .set({
    Authorization: `Bearer ${token}`
   })
   .send({
    amount: statement.amount,
    description: statement.description
   })

  expect(response.status).toBe(201)
  expect(response.body).toMatchObject({
   id: expect.any(String),
   user_id: expect.any(String),
   description: statement.description,
   amount: statement.amount,
   type: "withdraw"
  })
 })

 it("Should not be able to create a new statement from a noneexistent user", async () => {
  const { secret, expiresIn } = authConfig.jwt;

  const fakeId = uuidv4();
  const fakeToken = sign({}, secret, {
   subject: fakeId,
   expiresIn
  })

  const response = await request(app)
   .post("/api/v1/statements/withdraw")
   .set({
    Authorization: `Bearer ${fakeToken}`
   })
   .send({
    description: "Test description",
    amount: 100
   })

  expect(response.status).toBe(404)
  expect(response.body).toMatchObject({
   message: "User not found"
  })
 })
})