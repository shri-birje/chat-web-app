import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";

const dmKey = (a: string, b: string) => [a, b].sort().join(":");

export const openOrCreateDM = mutation({
  args: { meId: v.id("users"), otherUserId: v.id("users") },
  handler: async (ctx, { meId, otherUserId }) => {
    if (meId === otherUserId) throw new ConvexError("Invalid target");

    const key = dmKey(meId, otherUserId);
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_dm_key", (q) => q.eq("dmKey", key))
      .unique();

    if (existing) return existing._id;

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      kind: "dm",
      dmKey: key,
      createdBy: meId,
      createdAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: meId,
      joinedAt: now,
      lastReadAt: now,
      unreadCount: 0,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: otherUserId,
      joinedAt: now,
      lastReadAt: now,
      unreadCount: 0,
    });

    return conversationId;
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations"), meId: v.id("users") },
  handler: async (ctx, { conversationId, meId }) => {
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", meId)
      )
      .unique();
    if (!membership) throw new ConvexError("Forbidden");
    await ctx.db.patch(membership._id, { unreadCount: 0, lastReadAt: Date.now() });
  },
});
