import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthorized");
  return identity;
}

export async function getCurrentUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const clerkId = identity.subject ?? identity.tokenIdentifier;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) throw new ConvexError("User not found");
  return user;
}
