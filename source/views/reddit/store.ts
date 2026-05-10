// source/views/reddit/store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {PostListVariant} from './post-list'

type RedditPreferencesStore = {
	variant: PostListVariant
	setVariant: (variant: PostListVariant) => void
}

export const useRedditPreferences = create<RedditPreferencesStore>()(
	persist(
		(set) => ({
			variant: 'C',
			setVariant: (variant) => set({variant}),
		}),
		{
			name: 'reddit-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
