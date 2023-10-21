import {reducer as buildings} from './parts/buildings'
import {reducer as courses} from './parts/courses'
import {reducer as settings} from './parts/settings'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {combineReducers, configureStore} from '@reduxjs/toolkit'
import {
	FLUSH,
	PAUSE,
	PERSIST,
	persistReducer,
	persistStore,
	PURGE,
	REGISTER,
	REHYDRATE,
} from 'redux-persist'

const persistConfig = {
	key: 'root',
	version: 1,
	storage: AsyncStorage,
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
