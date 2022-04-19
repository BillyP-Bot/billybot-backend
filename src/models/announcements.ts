import { mongoose } from "../services";
import { IUser, users } from "./user";
import { Ref } from "../types";

export interface IAnnouncement extends mongoose.IModel {
	server_id: string
	user: Ref<IUser>
	text: string
	channel_name: string
}

export const announcements = mongoose.model<IAnnouncement>("Announcement",
	new mongoose.Schema({
		server_id: {
			type: String,
			index: true,
			required: true
		},
		user: {
			type: String,
			ref: users,
			index: true,
			required: true
		},
		text: {
			type: String,
			required: true
		},
		channel_name: {
			type: String,
			required: true
		}
	})
);

