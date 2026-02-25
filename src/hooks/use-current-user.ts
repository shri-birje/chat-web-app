"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function useCurrentUserSync() {
  const { user } = useUser();
  const upsert = useMutation(api.users.upsertMe);

  useEffect(() => {
    if (!user) return;

    upsert({
      name: user.fullName ?? "User",
      imageUrl: user.imageUrl ?? undefined,
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
    });
  }, [user, upsert]);
}