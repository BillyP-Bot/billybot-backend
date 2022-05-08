import { FastifyPluginCallback } from "fastify";

import { app, config } from "../services";
import { developerRouter } from "./developer";
import { userRouter } from "./user";
import { bucksRouter } from "./bucks";
import { metricsRouter } from "./metrics";
import { lotteryRouter } from "./lottery";
import { webhooksRouter } from "./webhooks";
import { announcementsRouter } from "./announcements";
import { serversRouter } from "./servers";
import { gamblingRouter } from "./gambling";

const routers = [
	developerRouter,
	userRouter,
	bucksRouter,
	metricsRouter,
	lotteryRouter,
	webhooksRouter,
	announcementsRouter,
	serversRouter,
	gamblingRouter
] as unknown as FastifyPluginCallback[];

routers.map((router) => app.register(router, { prefix: `/api/v${config.VERSION}` }));

export const controllers = app;
