import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const USER_STORAGE_KEY = 'notebase.userId';

interface UserState {
  userId: string;
}

const initialState: UserState = {
  userId: localStorage.getItem(USER_STORAGE_KEY) ?? '1',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId(state, action: PayloadAction<string>) {
      const next = action.payload.trim();
      if (next) state.userId = next;
    },
  },
});

export const { setUserId } = userSlice.actions;
export default userSlice.reducer;
