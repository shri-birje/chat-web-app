import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

const TYPING_TTL_MS = 2_500;

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    typing: v.boolean(),
  },
  handler: async (ctx, { conversationId, typing }) => {
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

    if (!typing) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    const expiresAt = Date.now() + TYPING_TTL_MS;
    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
      return;
    }

    await ctx.db.insert("typingStates", {
      conversationId,
      userId: meId,
      expiresAt,
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

    return rows
      .filter((row) => row.userId !== meId && row.expiresAt > now)
      .map((row) => row.userId);
  },
});
