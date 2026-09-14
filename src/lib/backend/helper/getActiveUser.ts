import db from "../db";

/** Returns the user row if that id belongs to an active user, otherwise undefined. */
export function getActiveUser(userId: number) {
  return db
    .prepare("SELECT id FROM users WHERE id = ? AND isActive = 1")
    .get(userId) as { id: number } | undefined;
}
