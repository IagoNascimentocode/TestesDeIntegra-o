import { Connection } from "typeorm";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import request from "supertest";

import authConfig from "../../config/auth";

import createConnection from "../../database"
import { app } from "../../app";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { User } from "../../modules/users/entities/User";
import { hash } from "bcryptjs";
import { StatementsRepository } from "../../modules/statements/repositories/StatementsRepository";

let connection: Connection;
let token: String;
let senderUser: User;
let receiverUser: User;

enum OperationType {
 DEPOSIT = "deposit",
 WITHDRAW = "withdraw",
}


describe("Get Statement Operation", () => {
 beforeAll(async () => {
  connection = await createConnection();
  await connection.runMigrations()

  const usersRepository = new UsersRepository;

  senderUser = await usersRepository.create({
   email: "test@test.com.br",
   name: "test",
   password: await hash("12345", 8)
  });

  receiverUser = await usersRepository.create({
   email: "test1@test.com.br",
   name: "test1",
   password: await hash("12345", 8)
  })

  const { secret, expiresIn } = authConfig.jwt;

  token = sign({ senderUser }, secret, {
   subject: senderUser.id,
   expiresIn
  })
 })

 afterAll(async () => {
  await connection.dropDatabase();
  await connection.close();
 })

 it("Should be able to get a statement with type statement", async () => {
  const statementsRepository = new StatementsRepository();

  const statement = await statementsRepository.create({
   amount: 100,
   description: "test 1",
   type: "withdraw" as OperationType,
   user_id: senderUser.id || ""
  });

  const response = await request(app)
   .get(`/api/v1/statements/${statement.id}`)
   .set({
    Authorization: `Bearer ${token}`
   })
   .send()

  expect(response.status).toBe(200)
  expect({
   ...response.body,
   amount: Number(response.body.amount),
   created_at: new Date(response.body.created_at),
   updated_at: new Date(response.body.updated_at)
  }).toEqual(statement);
 })

 it("Should not be able to get a statement from a noneexistent user", async () => {
  const statementsRepository = new StatementsRepository();

  const statement = await statementsRepository.create({
   amount: 200,
   description: "test",
   type: "deposit" as OperationType,
   user_id: senderUser.id || ""
  });

  const { secret, expiresIn } = authConfig.jwt;

  const fakeId = uuidv4();
  const fakeToken = sign({}, secret, {
   subject: fakeId,
   expiresIn
  })

  const response = await request(app)
   .get(`/api/v1/statements/${statement.id}`)
   .set({
    Authorization: `Bearer ${fakeToken}`
   })
   .send();

  expect(response.status).toBe(404);
  expect(response.body).toMatchObject({
   message: "User not found"
  });
 })

 it("Should not be able to get a nonexistent statement", async () => {
  const fakeId = uuidv4();

  const response = await request(app)
   .get(`/api/v1/statements/${fakeId}`)
   .set({
    Authorization: `Bearer ${token}`
   })
   .send()


  expect(response.status).toBe(404);
  expect(response.body).toMatchObject({
   message: "Statement not found"
  })
 })

})