import type {ListFilter} from '@frogpond/filter'
import type {ProcessedScore} from './types'
import {sportFilterSections} from './utils'

/** Names the filter's toolbar trigger, as `filter-trigger-sports`, for the UI tests. */
export const SPORTS_FILTER_KEY = 'sports'

/**
 * The toolbar's one filter: every sport in the feed, Women's first, then Men's,
 * then the rest, each run alphabetical. Selecting nothing is the resting state
 * and shows every game -- see `isFilterActive`.
 */
export function sportsFilter(
	scores: ProcessedScore[],
	selectedSports: string[],
): ListFilter<ProcessedScore> {
	const options = sportFilterSections(scores).flatMap((section) =>
		section.data.map((sport) => ({title: sport})),
	)
	const selected = options.filter((option) => selectedSports.includes(option.title))

	return {
		type: 'list',
		key: SPORTS_FILTER_KEY,
		enabled: selected.length > 0,
		spec: {
			title: 'Sports',
			options,
			selected,
			presentation: 'sheet',
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'sport'},
	}
}
