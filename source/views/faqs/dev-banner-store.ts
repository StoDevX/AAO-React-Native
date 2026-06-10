import {create} from 'zustand'
import type {Faq} from './types'

type DevBannerStore = {
	/** Dev-created banners that override/supplement production FAQ data */
	devBanners: Faq[]
	/** Whether the dev overlay is active */
	enabled: boolean
	/** Add or update a dev banner */
	upsertBanner: (banner: Faq) => void
	/** Remove a dev banner by id */
	removeBanner: (id: string) => void
	/** Clear all dev banners */
	clearAll: () => void
	/** Toggle the dev overlay on/off */
	setEnabled: (enabled: boolean) => void
}

export const useDevBannerStore = create<DevBannerStore>()((set) => ({
	devBanners: [],
	enabled: true,
	upsertBanner: (banner) =>
		set((state) => {
			let existing = state.devBanners.findIndex((b) => b.id === banner.id)
			if (existing >= 0) {
				let next = [...state.devBanners]
				next[existing] = banner
				return {devBanners: next}
			}
			return {devBanners: [...state.devBanners, banner]}
		}),
	removeBanner: (id) =>
		set((state) => ({
			devBanners: state.devBanners.filter((b) => b.id !== id),
		})),
	clearAll: () => set({devBanners: []}),
	setEnabled: (enabled) => set({enabled}),
}))
