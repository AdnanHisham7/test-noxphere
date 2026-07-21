// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  activeFranchiseId: string | null;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    activeFranchiseId: localStorage.getItem('activeFranchiseId'),
  } as UiState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setActiveFranchise: (state, action: PayloadAction<string>) => {
      state.activeFranchiseId = action.payload;
      localStorage.setItem('activeFranchiseId', action.payload);
    },
    clearActiveFranchise: (state) => {
      state.activeFranchiseId = null;
      localStorage.removeItem('activeFranchiseId');
    },
  },
});

export const { toggleSidebar, setActiveFranchise, clearActiveFranchise } = uiSlice.actions;
export default uiSlice.reducer;
