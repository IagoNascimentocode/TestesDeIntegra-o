import { Connection } from 'typeorm';
import request from 'supertest';

import authConfig from '../config/auth';
import { createConnection } from '../database';
import { app } from '../app';

import { UsersRepository } from '../modules/users/repositories/UsersRepository'
import { hash } from 'bcryptjs'
import { verify } from 'jsonwebtoken'



let connection: Connection;

describe("Authenticate User Controller", () => {

 beforeAll(async () => {
  connection = await createConnection();
  connection.runMigrations()
 })

 afterAll(async () => {
  connection.dropDatabase();
  connection.close();
 })

 it("Should be able to authenticate a existing user ans return a valid jwt token", async () => {
  const usersRepository = new UsersRepository();

  const user = await usersRepository.create({
   name: "Test2",
   email: "teste2@teste.com",
   password: await hash("12345", 8)
  })

  const response = await request(app).post("/api/v1/sessions").send({
   email: "teste2@teste.com",
   password: "12345"
  })

  console.log(response.body)
  expect(response.status).toBe(200)
  expect(response.body).toEqual({
   user: {
    id: user.id,
    name: user.name,
    email: user.email
   },
   token: expect.any(String)
  })

  expect(() => {
   verify(response.body.token, authConfig.jwt.secret);
  }).not.toThrowError();
 })
})
