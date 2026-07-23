// src/hooks/useCurrentFranchiseId.ts
import { useSelector } from "react-redux";
import { RootState } from "../store";

export const useCurrentFranchiseId = (): string | null => {
  return useSelector((state: RootState) => {
    // A coach is permanently locked to the single franchise they were
    // assigned at login — this always resolves straight from their user
    // record and deliberately never reads state.ui.activeFranchiseId, so
    // there is no code path (stale localStorage, another user's session
    // on the same browser, a leftover switch) that can move a coach out
    // of their own franchise.
    if (state.auth.user?.role === "coach") {
      return state.auth.user.franchiseId ?? null;
    }
    return state.ui.activeFranchiseId ?? state.auth.user?.franchiseId ?? null;
  });
};