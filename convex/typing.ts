import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TYPING_TTL_MS = 2_500;

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    meId: v.id("users"),
    typing: v.boolean(),
  },
  handler: async (ctx, { conversationId, meId, typing }) => {
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
  args: { conversationId: v.id("conversations"), meId: v.id("users") },
  handler: async (ctx, { conversationId, meId }) => {
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
