import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./auth";

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const me = await getCurrentUser(ctx);
    const meId = me._id;

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
      updatedAt: now,
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
