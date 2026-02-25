import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";

const ONLINE_WINDOW_MS = 30_000;

export const heartbeat = mutation({
  args: { meId: v.id("users") },
  handler: async (ctx, { meId }) => {
    const user = await ctx.db.get(meId);
    if (!user) throw new ConvexError("User not found");

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
