import type { ConnectFourColumn, IConnectFour, IUser } from "btbot-types";
import { ConnectFourColor } from "btbot-types";

import { mongoose } from "@services";
import { BadRequestError } from "@errors";
import { chance } from "@helpers";

class ConnectFourGames extends mongoose.Repository<IConnectFour> {
	constructor() {
		super("ConnectFourGame", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			red_user_id: {
				type: String,
				index: true,
				required: true
			},
			yellow_user_id: {
				type: String,
				index: true,
				required: true
			},
			to_move: {
				type: String,
				required: false,
				default: undefined
			},
			board: {
				required: false,
				default: [[], [], [], [], [], [], []],
				type: [
					[
						{
							type: String,
							enum: ConnectFourColor
						}
					]
				]
			},
			wager: {
				type: Number,
				required: false,
				default: 0
			},
			status: {
				type: String,
				required: false,
				default: undefined
			},
			is_accepted: {
				type: Boolean,
				required: false,
				default: false
			},
			is_complete: {
				type: Boolean,
				required: false,
				default: false
			}
		});
	}

	/** Return user's active game or open/unaccepted challenge if it exists, else null */
	public async getActiveGame(user: IUser, challenge?: boolean) {
		const { user_id, server_id } = user;
		return super.read({
			server_id,
			$or: [{ red_user_id: user_id }, { yellow_user_id: user_id }],
			is_accepted: challenge ? false : true,
			is_complete: false
		});
	}

	/** Return user's open/unaccepted active challenge if it exists, else null */
	public async getUnacceptedChallenge(user: IUser) {
		return this.getActiveGame(user, true);
	}

	/** Return true if user has an active game, else false */
	public async hasActiveGame(user: IUser) {
		if (await this.getActiveGame(user)) return true;
		return false;
	}

	/** Throw error if the user does not have an active game, else return the game */
	public async assertHasActiveGame(user: IUser) {
		const game = await this.getActiveGame(user);
		if (!game) throw new BadRequestError("You do not have an active game of Connect Four!");
		return game;
	}

	/** Challenge another player to a game */
	public async createNewChallenge(challengerUser: IUser, challengedUser: IUser, wager: number) {
		return super.insertOne({
			server_id: challengerUser.server_id,
			red_user_id: challengerUser.user_id,
			yellow_user_id: challengedUser.user_id,
			wager
		});
	}

	/** Update an existing challenge if necessary (either target a different opponent player, or update the wager amount) */
	public async updateExistingChallenge(
		existingChallenge: IConnectFour,
		challengedUser: IUser,
		wager: number
	) {
		if (
			existingChallenge.yellow_user_id === challengedUser.user_id &&
			existingChallenge.wager === wager
		)
			return existingChallenge;
		const { _id } = existingChallenge;
		return super.updateOne({ _id }, { yellow_user_id: challengedUser.user_id, wager });
	}

	/** Randomly pick which player moves first and start the game */
	public async acceptExistingChallengeAndStartGame(existingChallenge: IConnectFour) {
		const { _id, red_user_id, yellow_user_id } = existingChallenge;
		const to_move = chance.bool() ? red_user_id : yellow_user_id;
		return super.updateOne({ _id }, { to_move, is_accepted: true });
	}

	/** Validate move and update the board */
	public moveHandler(user: IUser, game: IConnectFour, move: number) {
		if (game.to_move !== user.user_id) throw new BadRequestError("It is not your turn!");
		if (move < 0 || move > 6)
			throw new BadRequestError(
				"Invalid move - value must be an integer between 0 and 6 inclusive!"
			);
		if (game.board[move].length >= 6)
			throw new BadRequestError("Invalid move - board column is full!");
		game.board[move].push(
			game.to_move === game.red_user_id ? ConnectFourColor.red : ConnectFourColor.yellow
		);
		return game;
	}

	/** Check for four in a row (horizontally, vertically, ascending diagonally, descending diagonally) */
	public async isGameWon(game: IConnectFour) {
		const { board } = game;
		const color =
			game.to_move === game.red_user_id ? ConnectFourColor.red : ConnectFourColor.yellow;

		return Promise.all([
			this.winCheckHorizonally(board, color),
			this.winCheckVertically(board, color),
			this.winCheckAscendingDiagonally(board, color),
			this.winCheckDescendingDiagonally(board, color)
		]);
	}

	/** Check for four in a row horizonally*/
	private async winCheckHorizonally(board: ConnectFourColumn[], color: ConnectFourColor) {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 6; j++) {
				if (
					board[i][j] == color &&
					board[i + 1][j] == color &&
					board[i + 2][j] == color &&
					board[i + 3][j] == color
				)
					return true;
			}
		}
		return false;
	}

	/** Check for four in a row vertically*/
	private async winCheckVertically(board: ConnectFourColumn[], color: ConnectFourColor) {
		for (let i = 0; i < 7; i++) {
			for (let j = 0; j < 3; j++) {
				if (
					board[i][j] == color &&
					board[i][j + 1] == color &&
					board[i][j + 2] == color &&
					board[i][j + 3] == color
				)
					return true;
			}
		}
		return false;
	}

	/** Check for four in a row ascending diagonally*/
	private async winCheckAscendingDiagonally(board: ConnectFourColumn[], color: ConnectFourColor) {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 3; j++) {
				if (
					board[i][j] == color &&
					board[i + 1][j + 1] == color &&
					board[i + 2][j + 2] == color &&
					board[i + 3][j + 3] == color
				)
					return true;
			}
		}
		return false;
	}

	/** Check for four in a row descending diagonally*/
	private async winCheckDescendingDiagonally(
		board: ConnectFourColumn[],
		color: ConnectFourColor
	) {
		for (let i = 0; i < 4; i++) {
			for (let j = 3; j < 6; j++) {
				if (
					board[i][j] == color &&
					board[i + 1][j - 1] == color &&
					board[i + 2][j - 2] == color &&
					board[i + 3][j - 3] == color
				)
					return true;
			}
		}
		return false;
	}

	/** Return true if the game is a draw (board is full), else false */
	public isGameDrawn(game: IConnectFour) {
		for (const column of game.board) {
			if (column.length < 6) return false;
		}
		return true;
	}

	/** Update the gamestate at the end of a turn */
	public async endTurn(game: IConnectFour) {
		const { _id } = game;
		return super.updateOne({ _id }, game);
	}
}

export const connectFourGames = new ConnectFourGames();
