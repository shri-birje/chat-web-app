import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), meId: v.id("users"), body: v.string() },
  handler: async (ctx, { conversationId, meId, body }) => {
    const text = body.trim();
    if (!text) return;

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", meId)
      )
      .unique();
    if (!member) throw new ConvexError("Forbidden");

    const now = Date.now();
    await ctx.db.insert("messages", { conversationId, senderId: meId, body: text, createdAt: now });

    await ctx.db.patch(conversationId, {
      lastMessageText: text,
      lastMessageAt: now,
      lastMessageSenderId: meId,
    });

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    for (const m of members) {
      if (m.userId !== meId) {
        await ctx.db.patch(m._id, { unreadCount: m.unreadCount + 1 });
      }
    }
  },
});
