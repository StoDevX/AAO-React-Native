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
	/** Presence's stable slug for the org, e.g. "bird-alliance-3" -- not
	 * derivable from `name`, so it's the only reliable key for matching an
	 * org to its category memberships from ccc-server's `/orgs/categories`
	 * route. */
	organizationUri: string
	/** Current member count, as Presence reports it. */
	memberCount: number
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

/** One of Presence's org categories, live from ccc-server's `/orgs/categories`
 * route -- every org uri currently in it, grouped server-side. */
export type OrgCategoryMembership = {
	/** Presence's stable id for the category, e.g. "PBnP". */
	catIdh: string
	name: string
	organizationUris: string[]
}
