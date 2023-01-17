import {configureStore} from '@reduxjs/toolkit'

import {reducer as settings} from './parts/settings'
import {reducer as buildings} from './parts/buildings'
import {reducer as courses} from './parts/courses'

export const store = configureStore({
	reducer: {
		settings,
		buildings,
        courses,
	},
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
