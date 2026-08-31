import type {ListItemSpecType} from './types'

/**
 * The options a list filter should show as selected, given the titles the user
 * picked.
 *
 * Selecting nothing is the resting state and shows everything, so a filter
 * nobody has touched (`null`) and one the user has cleared (`[]`) are the same
 * state and need not be told apart. Showing nothing is not a state a filter can
 * be in.
 *
 * The options come from the data, so they change under the selection: a title
 * the source has stopped offering selects nothing and does not come back.
 */
export function selectedOptions(
	options: ListItemSpecType[],
	chosenTitles: string[] | null,
): ListItemSpecType[] {
	if (chosenTitles === null) {
		return []
	}

	return options.filter((option) => chosenTitles.includes(option.title))
}
