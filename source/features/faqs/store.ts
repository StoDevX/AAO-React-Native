import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {Faq} from './types'

type DismissedEntry = {
	version: string
	dismissedAt: number
}

type DismissedMap = Record<string, DismissedEntry>

type BannerStore = {
	dismissed: DismissedMap
	dismissFaq: (faqId: string, version: string) => void
}

export const getFaqVersion = (faq: Faq): string =>
	faq.updatedAt ?? `${faq.question}::${faq.answer.length}`

export const useFaqBannerStore = create<BannerStore>()(
	persist(
		(set) => ({
			dismissed: {},
			dismissFaq: (faqId, version) =>
				set((state) => ({
					dismissed: {
						...state.dismissed,
						[faqId]: {version, dismissedAt: Date.now()},
					},
				})),
		}),
		{
			name: 'faq-banner-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
