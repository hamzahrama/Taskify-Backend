import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Taskify API workflow (e2e)', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  const email = `e2e-${Date.now()}@example.com`;
  let boardId: string;
  let taskId: string;
  let secondColumnId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  it('registers, authenticates, refreshes, and logs out', async () => {
    await agent.post('/auth/register').send({ name: 'E2E User', email, password: 'Password123!' }).expect(201);
    const login = await agent.post('/auth/login').send({ email, password: 'Password123!' }).expect(200).expect(({ body }) => {
      expect(body.data.accessToken).toEqual(expect.any(String));
    });
    const refreshCookie = login.headers['set-cookie'][0].split(';')[0];
    const refresh = await agent.post('/auth/refresh').set('Cookie', refreshCookie).expect(200).expect(({ body }) => {
      expect(body.data.accessToken).toEqual(expect.any(String));
    });
    const rotatedCookie = refresh.headers['set-cookie'][0].split(';')[0];
    await agent.post('/auth/logout').set('Cookie', rotatedCookie).expect(200);
  }, 20_000);

  it('runs board, column, task CRUD and task move workflow', async () => {
    const login = await agent.post('/auth/login').send({ email, password: 'Password123!' }).expect(200);
    const token = login.body.data.accessToken;
    const auth = { Authorization: `Bearer ${token}` };

    const board = await agent.post('/boards').set(auth).send({ title: 'E2E Board' }).expect(201);
    boardId = board.body.id;
    const firstColumnId = board.body.columns[0].id;
    secondColumnId = board.body.columns[1].id;

    const createdTask = await agent.post('/tasks').set(auth).send({ columnId: firstColumnId, title: 'E2E Task', priority: 'HIGH' }).expect(201);
    taskId = createdTask.body.id;
    await agent.patch(`/tasks/${taskId}`).set(auth).send({ title: 'Updated E2E Task' }).expect(200);
    await agent.patch(`/tasks/${taskId}/move`).set(auth).send({ targetColumnId: secondColumnId, newOrder: 0 }).expect(200);
    await agent.get(`/boards/${boardId}`).set(auth).expect(200).expect(({ body }) => {
      expect(body.columns.find((column: { id: string }) => column.id === secondColumnId).tasks[0].id).toBe(taskId);
    });
    await agent.delete(`/tasks/${taskId}`).set(auth).expect(200);
    await agent.delete(`/boards/${boardId}`).set(auth).expect(200);
  }, 20_000);

  afterAll(async () => {
    await app.close();
  });
});