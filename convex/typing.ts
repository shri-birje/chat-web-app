import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

const TYPING_TTL_MS = 3_000;

export const setTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    const meId = me._id;

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", meId)
      )
      .unique();
    if (!membership) throw new ConvexError("Forbidden");

    const existing = await ctx.db
      .query("typingStates")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", meId)
      )
      .unique();

    const expiresAt = Date.now() + TYPING_TTL_MS;
    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      await ctx.db.insert("typingStates", {
        conversationId,
        userId: meId,
        expiresAt,
      });
    }

    await ctx.scheduler.runAfter(TYPING_TTL_MS + 50, internal.typing.clearExpiredTyping, {
      conversationId,
      userId: meId,
      expectedExpiresAt: expiresAt,
    });
  },
});

export const listTypingUsers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    const meId = me._id;

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", meId)
      )
      .unique();
    if (!membership) throw new ConvexError("Forbidden");

    const now = Date.now();
    const rows = await ctx.db
      .query("typingStates")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    return rows.filter((row) => row.expiresAt > now).map((row) => row.userId);
  },
});

export const clearExpiredTyping = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expectedExpiresAt: v.number(),
  },
  handler: async (ctx, { conversationId, userId, expectedExpiresAt }) => {
    const state = await ctx.db
      .query("typingStates")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .unique();

    if (!state) return;
    if (state.expiresAt !== expectedExpiresAt) return;
    if (state.expiresAt > Date.now()) return;

    await ctx.db.delete(state._id);
  },
});
