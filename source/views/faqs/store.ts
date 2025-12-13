import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {Faq} from './query'

type DismissedMap = Record<string, string>

type BannerStore = {
	dismissed: DismissedMap
	dismissFaq: (faqId: string, version: string) => void
	resetFaq: (faqId: string) => void
	resetAll: () => void
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
						[faqId]: version,
					},
				})),
			resetFaq: (faqId) =>
				set((state) => {
					let next = {...state.dismissed}
					delete next[faqId]
					return {dismissed: next}
				}),
			resetAll: () => set({dismissed: {}}),
		}),
		{
			name: 'faq-banner-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
