"use client";

export type CurrentUser = {
  id: string;
  name: string;
  imageUrl?: string;
};

export function useCurrentUser() {
  return {
    user: null as CurrentUser | null,
    isLoading: true,
  };
}
