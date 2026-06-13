// realtime-allow-public
import { live } from 'svelte-realtime/server';

type UserData = {
  key: string;
  name: string;
  image: string | null;
  username: string;
};

const presenceMap = new Map<string, Map<string, { count: number; data: UserData }>>();

export const presence = live.stream(
  (ctx: any, convId: string) => `presence:${convId}`,
  async (ctx: any, convId: string) => {
    const topic = `presence:${convId}`;
    const users = presenceMap.get(topic);
    if (!users) return [];
    return Array.from(users.values()).map((e) => e.data);
  },
  {
    merge: 'presence',
    onSubscribe(ctx: any, topic: string) {
      const userData: UserData = {
        key: ctx.user.id,
        name: ctx.user.name,
        image: ctx.user.image ?? null,
        username: ctx.user.username
      };

      let users = presenceMap.get(topic);
      if (!users) {
        users = new Map();
        presenceMap.set(topic, users);
      }

      const existing = users.get(ctx.user.id);
      if (existing) {
        existing.count++;
      } else {
        users.set(ctx.user.id, { count: 1, data: userData });
        ctx.publish(topic, 'join', userData);
      }
    },
    onUnsubscribe(ctx: any, topic: string) {
      const users = presenceMap.get(topic);
      if (!users) return;

      const entry = users.get(ctx.user.id);
      if (!entry) return;

      entry.count--;
      if (entry.count <= 0) {
        users.delete(ctx.user.id);
        if (users.size === 0) presenceMap.delete(topic);
        ctx.publish(topic, 'leave', { key: ctx.user.id });
      }
    }
  }
);
