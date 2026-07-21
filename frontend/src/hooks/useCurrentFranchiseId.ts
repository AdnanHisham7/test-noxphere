// src/hooks/useCurrentFranchiseId.ts
import { useSelector } from "react-redux";
import { RootState } from "../store";

export const useCurrentFranchiseId = (): string | null => {
  return useSelector(
    (state: RootState) => state.ui.activeFranchiseId ?? state.auth.user?.franchiseId ?? null,
  );
};
