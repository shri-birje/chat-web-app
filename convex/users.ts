import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireIdentity } from "./auth";

export const upsertMe = mutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const clerkId = identity.subject ?? identity.tokenIdentifier;
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const searchUsers = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    const me = await getCurrentUser(ctx);
    const term = search.trim();

    const rows = term
      ? await ctx.db
          .query("users")
          .withSearchIndex("search_name", (q) => q.search("name", term))
          .take(30)
      : await ctx.db.query("users").take(50);

    return rows.filter((u) => u._id !== me._id);
  },
});
