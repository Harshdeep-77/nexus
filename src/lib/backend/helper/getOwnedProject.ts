import db from "../db";

/** Returns the project if it exists, is not soft-deleted, and belongs to this user. */
export function getOwnedProject(projectId: string | number, userId: number) {
    return db.prepare("SELECT id FROM project WHERE id = ? AND user_id = ? AND isActive = 1")
           .get(projectId, userId) as { id: number } | undefined
}
