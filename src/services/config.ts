// app info
export const IS_LOCAL = process.env.IS_LOCAL ? true : false;
export const STAGE = process.env.STAGE as string;
export const VERSION = process.env.VERSION as string;
export const REGION = process.env.REGION as string;
export const COOKIE_NAME = "billybot.dashboard.jid";
// secrets
export const EMAIL = process.env.EMAIL as string;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
export const STOCK_API_KEY = process.env.STOCK_API_KEY as string;
export const BOT_TOKEN = process.env.BOT_TOKEN as string;
export const ODDS_API_KEY = process.env.ODDS_API_KEY as string;
// resources
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET as string;
export const OPENAI_BUCKET = process.env.OPENAI_BUCKET as string;
export const REFRESH_TOKEN_QUEUE = ""; // disabled for now
export const NOTIFICATION_QUEUE = ""; // disabled for now
// static urls
export const DISCORD_API = "https://discord.com/api";
export const STOCK_API_URL = "https://finnhub.io/api/v1";
export const DASHBOARD_URL = IS_LOCAL ? "http://localhost:3000" : "https://billybot.vercel.app";
export const DASHBOARD_DOMAIN = IS_LOCAL ? "localhost" : "billybot.vercel.app";
export const API_URL = `${process.env.API_URL}/api/v${VERSION}`;
export const NBA_API_URL = "https://data.nba.com/data/10s/v2015/json/mobile_teams/nba";
export const ODDS_API_URL = "https://api.the-odds-api.com/v4";
