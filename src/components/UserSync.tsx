"use client";

import { useCurrentUserSync } from "@/hooks/use-current-user";

export default function UserSync() {
  useCurrentUserSync();
  return null;
}
