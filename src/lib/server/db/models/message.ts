import { db } from "..";
import { message } from "../schema"

export async function send(userId: string, convId: string, data: string) {
  db.insert(message).values({
    convId,
    data,
    meta: JSON.stringify({ type: 'message' }),
    userId
  });
}
