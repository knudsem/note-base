import { createListenerMiddleware } from '@reduxjs/toolkit';

import { api } from './api';
import { USER_STORAGE_KEY, setUserId } from './userSlice';

export const userListener = createListenerMiddleware();

userListener.startListening({
  actionCreator: setUserId,
  effect: async (action, listenerApi) => {
    localStorage.setItem(USER_STORAGE_KEY, action.payload);
    listenerApi.dispatch(api.util.resetApiState());
  },
});
