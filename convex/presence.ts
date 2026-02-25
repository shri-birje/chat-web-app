import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

const ONLINE_WINDOW_MS = 30_000;

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    const meId = me._id;

    const now = Date.now();
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", meId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now });
      return existing._id;
    }

    return await ctx.db.insert("presence", {
      userId: meId,
      lastSeenAt: now,
    });
  },
});

export const getOnlineStatus = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, { userIds }) => {
    await getCurrentUser(ctx);
    const now = Date.now();
    const rows = await Promise.all(
      userIds.map(async (userId) => {
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique();

        return {
          userId,
          isOnline: !!presence && now - presence.lastSeenAt < ONLINE_WINDOW_MS,
          lastSeenAt: presence?.lastSeenAt ?? 0,
        };
      })
    );

    return rows;
  },
});
