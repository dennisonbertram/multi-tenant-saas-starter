/**
 * Constants shared between the edge middleware and node-runtime code.
 * Keep this module free of node:* imports — the middleware bundle cannot
 * include them.
 */

export const SESSION_COOKIE = "session";
