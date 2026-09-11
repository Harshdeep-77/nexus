import db from "../db";

export function getOwnedProject(projectId:string | number,userId:number){
    return db.prepare("SELECT id FROM project where id = ? AND user_id = ? ")
           .get(projectId,userId) as {id:number} | undefined
}