import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./auth";

const dmKey = (a: Id<"users">, b: Id<"users">) => [a, b].sort().join(":");
type ConvexCtx = MutationCtx | QueryCtx;

async function requireMembership(
  ctx: ConvexCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversation_user", (q) =>
      q.eq("conversationId", conversationId).eq("userId", userId)
    )
    .unique();
  if (!membership) throw new ConvexError("Forbidden");
  return membership;
}

async function loadConversationMembers(
  ctx: ConvexCtx,
  conversationId: Id<"conversations">
) {
  const memberships = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .collect();

  const members = await Promise.all(
    memberships.map(async (membership) => {
      const user = await ctx.db.get(membership.userId);
      if (!user) return null;
      return {
        userId: user._id,
        name: user.name,
        imageUrl: user.imageUrl,
        email: user.email,
      };
    })
  );

  return members.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );
}

async function openOrCreateDMInternal(
  ctx: MutationCtx,
  meId: Id<"users">,
  otherUserId: Id<"users">
) {
  if (meId === otherUserId) throw new ConvexError("Invalid target");

  const otherUser = await ctx.db.get(otherUserId);
  if (!otherUser) throw new ConvexError("User not found");

  const key = dmKey(meId, otherUserId);
  const existing = await ctx.db
    .query("conversations")
    .withIndex("by_dm_key", (q) => q.eq("dmKey", key))
    .unique();

  const now = Date.now();

  if (existing) {
    const meMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", existing._id).eq("userId", meId)
      )
      .unique();
    if (!meMembership) {
      await ctx.db.insert("conversationMembers", {
        conversationId: existing._id,
        userId: meId,
        joinedAt: now,
        lastReadAt: now,
        unreadCount: 0,
      });
    }

    const otherMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", existing._id).eq("userId", otherUserId)
      )
      .unique();
    if (!otherMembership) {
      await ctx.db.insert("conversationMembers", {
        conversationId: existing._id,
        userId: otherUserId,
        joinedAt: now,
        lastReadAt: now,
        unreadCount: 0,
      });
    }

    return existing._id;
  }

  const conversationId = await ctx.db.insert("conversations", {
    kind: "dm",
    dmKey: key,
    createdBy: meId,
    createdAt: now,
    updatedAt: now,
    lastMessageText: "",
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
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);

    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const rows = await Promise.all(
      myMemberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        const members = await loadConversationMembers(ctx, conversation._id);
        const otherMembers = members.filter((member) => member.userId !== me._id);
        const title =
          otherMembers.length > 0
            ? otherMembers.map((member) => member.name).join(", ")
            : "You";
        const updatedAt =
          conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;

        return {
          _id: conversation._id,
          kind: conversation.kind,
          createdAt: conversation.createdAt,
          updatedAt,
          lastMessageText: conversation.lastMessageText,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageSenderId: conversation.lastMessageSenderId,
          unreadCount: membership.unreadCount,
          members,
          title,
        };
      })
    );

    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const open = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    const membership = await requireMembership(ctx, conversationId, me._id);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new ConvexError("Conversation not found");

    const members = await loadConversationMembers(ctx, conversationId);
    const otherMembers = members.filter((member) => member.userId !== me._id);
    const title =
      otherMembers.length > 0
        ? otherMembers.map((member) => member.name).join(", ")
        : "You";
    const updatedAt =
      conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;

    return {
      _id: conversation._id,
      kind: conversation.kind,
      createdAt: conversation.createdAt,
      updatedAt,
      lastMessageText: conversation.lastMessageText,
      lastMessageAt: conversation.lastMessageAt,
      lastMessageSenderId: conversation.lastMessageSenderId,
      unreadCount: membership.unreadCount,
      members,
      title,
    };
  },
});

export const members = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    await requireMembership(ctx, conversationId, me._id);
    return await loadConversationMembers(ctx, conversationId);
  },
});

export const create = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const me = await getCurrentUser(ctx);
    return await openOrCreateDMInternal(ctx, me._id, otherUserId);
  },
});

export const openOrCreateDM = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const me = await getCurrentUser(ctx);
    return await openOrCreateDMInternal(ctx, me._id, otherUserId);
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    const membership = await requireMembership(ctx, conversationId, me._id);
    await ctx.db.patch(membership._id, { unreadCount: 0, lastReadAt: Date.now() });
  },
});
