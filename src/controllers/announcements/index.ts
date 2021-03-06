import type { FastifyInstance } from "fastify";
import type { IAnnouncement, IServer, IUser } from "btbot-types";

import { servers, users, webhooks, announcements } from "@models";

export const announcementsRouter = async function (app: FastifyInstance) {
	app.post<{ Body: IAnnouncement & IUser }>(
		"/announcements",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id", "text", "channel_name"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						text: { type: "string" },
						channel_name: { type: "string" }
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, text, channel_name } = req.body;
			await servers.assertExists({ server_id });
			const [user, webhook] = await Promise.all([
				users.readAdmin(user_id, server_id),
				webhooks.assertRead({ server_id, channel_name })
			]);
			return await announcements.postAdminUpdate(webhook, user, text);
		}
	);
	app.get<{
		Params: IServer;
		Querystring: {
			page: number;
			created_at: number;
		};
	}>(
		"/announcements/server/:server_id",
		{
			schema: {
				params: { $ref: "serverIdParams#" },
				querystring: {
					type: "object",
					additionalProperties: false,
					properties: {
						page: { type: "number", default: 1, minimum: 1 },
						created_at: { type: "number", enum: [1, -1], default: -1 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							pages: { type: "number" },
							announcements: { $ref: "announcementArray#" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id } = req.params;
			const { page, created_at } = req.query;
			await servers.assertExists({ server_id });
			const filter = {
				server_id
			};
			const { pages, items } = await announcements.paginate(filter, {
				page,
				sort: { created_at },
				populate: [{ path: "user", select: ["username", "user_id"] }]
			});
			return {
				pages,
				announcements: items
			};
		}
	);
};
