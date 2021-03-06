import { ClientElevation, IClient, ClientConnectionStatus, IServer } from "btbot-types";

import { jwt, mongoose, oauth, password } from "@services";
import { nanoid } from "@helpers";
import { BadRequestError, UnauthorizedError } from "@src/types";

interface IAuthorizedClient extends IClient {
	auth_state: {
		user_id: string;
		username: string;
		discriminator: string;
		avatar: string;
		access_token: string;
		refresh_token: string;
		registered_servers?: string[];
	};
}

class Clients extends mongoose.Repository<IClient> {
	constructor() {
		super("Client", {
			email: {
				type: String,
				index: true,
				required: true
			},
			username: {
				type: String,
				index: true,
				required: true
			},
			password: {
				type: String,
				required: true
			},
			elevation: {
				type: String,
				enum: Object.values(ClientElevation),
				default: ClientElevation.user
			},
			token_version: {
				type: Number,
				default: 0
			},
			connection_status: {
				type: String,
				enum: Object.values(ClientConnectionStatus),
				default: ClientConnectionStatus.disconnected
			},
			auth_state: {
				_id: false,
				required: false,
				user_id: {
					type: String,
					required: false
				},
				username: {
					type: String,
					required: false
				},
				discriminator: {
					type: String,
					required: false
				},
				avatar: {
					type: String,
					required: false
				},
				access_token: {
					type: String,
					required: false
				},
				refresh_token: {
					type: String,
					required: false
				},
				registered_servers: {
					type: [String],
					required: false
				}
			}
		});
	}

	public async assertNewClient({ username, email }: IClient) {
		// TODO: perform stricter checks
		const emailTaken = await super.exists({ email });
		if (emailTaken) throw new BadRequestError("email taken");
		const userNameTaken = await super.exists({ username });
		if (userNameTaken) throw new BadRequestError("username taken");
	}

	public async register(client: IClient) {
		await this.assertNewClient(client);
		const hash = await password.hashPassword(client.password);
		const newClient = await super.insertOne({ ...client, password: hash });
		return newClient;
	}

	public async login({ username, password: pass }: IClient) {
		const client = await super.read({ username });
		if (!client) throw new UnauthorizedError("username not found");
		const match = await password.comparePassword(pass, client.password);
		if (!match) throw new UnauthorizedError("incorrect password");
		return client;
	}

	public async resetPassword({ username, email }: { username: string; email: string }) {
		const client = await super.read({ username, email });
		if (!client) throw new UnauthorizedError("username or email not found");
		const tempPassword = nanoid();
		const hash = await password.hashPassword(tempPassword);
		await super.updateOne({ _id: client._id }, { password: hash });
		return { client, tempPassword };
	}

	public async assertReadByToken(token: string): Promise<IClient> {
		const { token_version, _id } = jwt.verify<{ token_version: number; _id: string }>(token);
		const exists = await super.read({ _id, token_version });
		if (!exists) throw new UnauthorizedError("invalid token");
		return exists;
	}

	public async assertAuth(token: string): Promise<IAuthorizedClient> {
		const client = await this.assertReadByToken(token);
		const { auth_state } = client;
		if (!auth_state) throw new UnauthorizedError("no auth client connected");
		if (!auth_state.refresh_token || !auth_state.access_token)
			throw new UnauthorizedError("no auth client connected");
		return client as IAuthorizedClient;
	}

	public async connectOauthAccount(code: string, token: string): Promise<IClient> {
		const { _id } = await this.assertReadByToken(token);
		const { refresh_token, access_token } = await oauth.authorize(code);
		const user = await oauth.getUserInfo(access_token);
		const client = await super.updateOne(
			{ _id },
			{
				connection_status: ClientConnectionStatus.connected,
				"auth_state.refresh_token": refresh_token,
				"auth_state.access_token": access_token,
				"auth_state.user_id": user.id,
				"auth_state.username": user.username,
				"auth_state.discriminator": user.discriminator,
				"auth_state.avatar": user.avatar
			}
		);
		return client as IClient;
	}

	public async refreshClient(authToken: string): Promise<IClient> {
		// verify token
		const { _id, auth_state } = await this.assertReadByToken(authToken);
		// assert oauth account is connected
		if (!auth_state?.refresh_token || !auth_state?.access_token)
			throw new UnauthorizedError("no auth client connected");
		// refresh oauth credentials
		const { refresh_token, access_token } = await oauth.refresh(auth_state.refresh_token);
		const user = await oauth.getUserInfo(access_token);
		// updated user info
		const updatedClient = await super.updateOne(
			{ _id },
			{
				"auth_state.refresh_token": refresh_token,
				"auth_state.access_token": access_token,
				"auth_state.user_id": user.id,
				"auth_state.username": user.username,
				"auth_state.discriminator": user.discriminator,
				"auth_state.avatar": user.avatar
			}
		);
		return updatedClient as IClient;
	}

	public async listGuildIds(authToken: string) {
		const { auth_state } = await this.assertReadByToken(authToken);
		if (!auth_state?.refresh_token || !auth_state?.access_token)
			throw new UnauthorizedError("no auth client connected");
		const guilds = await oauth.getUserGuilds(auth_state.access_token);
		return guilds.map(({ id }) => id);
	}

	public async refreshGuilds(token: string, guilds: IServer[]): Promise<IClient> {
		const { auth_state, _id } = await this.assertReadByToken(token);
		if (!auth_state?.refresh_token || !auth_state?.access_token)
			throw new UnauthorizedError("no auth client connected");
		if (guilds.length === 0) {
			return super.updateOne(
				{ _id },
				{ "auth_state.registered_servers": [] }
			) as Promise<IClient>;
		}
		const matchIds = guilds.map(({ server_id }) => server_id);
		return super.updateOne(
			{ _id },
			{ "auth_state.registered_servers": matchIds }
		) as Promise<IClient>;
	}
}

export const clients = new Clients();
