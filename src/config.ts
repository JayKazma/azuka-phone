import Constants from "expo-constants";

export const OWNER = "Sento";
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
export const DEFAULT_PORT = 8766;
export const STATUS_EVERY_MS = 5000;
export const PING_EVERY_MS = 5000;
export const SPOTIFY_EVERY_MS = 10000;
export const PHONE_NAME = Constants.deviceName || "iPhone";
export const SCREEN_FPS = 2;
export const SCREEN_EVERY_MS = 560;
export const SCREEN_WIDTH = 720;
export const ACTIVITY_MAX = 200;
export const PCM_CHUNK_BYTES = 8000;
