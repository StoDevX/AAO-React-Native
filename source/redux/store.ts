import {configureStore, combineReducers} from '@reduxjs/toolkit'

import {reducer as settings} from './parts/settings'
import {reducer as buildings} from './parts/buildings'
import {reducer as courses} from './parts/courses'

import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Guard against AsyncStorage being unavailable (e.g. native module bridge not
// ready after a JS reload). Provide a no-op fallback so redux-persist doesn't
// crash when calling storage.getItem / setItem.
const safeStorage = AsyncStorage ?? {
	getItem: () => Promise.resolve(null),
	setItem: () => Promise.resolve(),
	removeItem: () => Promise.resolve(),
}

const persistConfig = {
	key: 'root',
	version: 1,
	storage: safeStorage,
}

const rootReducer = combineReducers({
	settings,
	buildings,
	courses,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
})

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
