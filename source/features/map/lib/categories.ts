import type {Category} from '../types'

/** The category segments the picker offers, in the order it draws them. */
export const CATEGORY_LABELS = ['Buildings', 'Outdoors', 'Parking', 'Athletics'] as const

export type CategoryLabel = (typeof CATEGORY_LABELS)[number]

/** The segment's own label is its tag, so this is what turns one into the
 * category key a feature carries. */
export const LABEL_TO_CATEGORY: Record<CategoryLabel, Category> = {
	Buildings: 'building',
	Outdoors: 'outdoors',
	Parking: 'parking',
	Athletics: 'athletics',
}
