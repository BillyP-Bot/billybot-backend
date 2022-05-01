import { FastifyInstance } from "fastify";

export const developerRouter = async function (app: FastifyInstance) {
	app.get("/developer/ping", {
		preValidation: [app.restricted],
		schema: {
			response: {
				200: { $ref: "ping#" }
			}
		},
	}, async () => {
		return { ok: true };
	});
};
