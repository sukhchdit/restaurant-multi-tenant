import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  isCompactView: boolean;
}

const initialState: UIState = {
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  isSidebarCollapsed: false,
  isCompactView: localStorage.getItem('compactView') === 'true',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('darkMode', String(state.isDarkMode));
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      localStorage.setItem('darkMode', String(action.payload));
      if (action.payload) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    toggleCompactView: (state) => {
      state.isCompactView = !state.isCompactView;
      localStorage.setItem('compactView', String(state.isCompactView));
    },
  },
});

export const { toggleDarkMode, setDarkMode, toggleSidebar, toggleCompactView } = uiSlice.actions;
export default uiSlice.reducer;
