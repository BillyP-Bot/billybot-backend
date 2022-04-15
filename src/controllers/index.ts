import { FastifyPluginCallback } from "fastify";

import { app, config } from "../services";
import { developerRouter } from "./developer";
import { userRouter } from "./user";
import { bucksRouter } from "./bucks";
import { metricsRouter } from "./metrics";
import { lotteryRouter } from "./lottery";
import { webhooksRouter } from "./webhooks";

const routers = [
	developerRouter,
	userRouter,
	bucksRouter,
	metricsRouter,
	lotteryRouter,
	webhooksRouter
] as unknown as FastifyPluginCallback[];

for (const router of routers) {
	app.register(router, { prefix: `/api/v${config.VERSION}` });
}

export const controllers = app;
