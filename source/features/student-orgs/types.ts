import type {Gradient} from '@frogpond/colors'
import type {SFSymbol} from 'sf-symbols-typescript'

export type ContactPersonType = {
	lastName: string
	title: string
	firstName: string
	email: string
}

export type AdvisorType = {
	email: string
	name: string
}

export type StudentOrgType = {
	meetings: string
	contacts: ContactPersonType[]
	advisors: AdvisorType[]
	description: string
	category: string
	lastUpdated: string
	website: string
	name: string
}

/** One curated entry from `data/org-categories.yaml`. */
export type OrgCategoryType = {
	name: string
	/**
	 * The tile's SF Symbol. Optional in TypeScript though the schema requires
	 * it: a released app can meet data deployed before this field existed.
	 */
	icon?: SFSymbol
	/** A name from `GRADIENT_NAMES`, or an explicit `[inner, outer]` pair. */
	gradient?: string | Gradient
}
