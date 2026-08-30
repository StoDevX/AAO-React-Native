import type {ListItemSpecType} from './types'

/**
 * The options a list filter should show as selected, given the titles the user
 * picked.
 *
 * A filter nobody has touched narrows nothing, so `null` selects everything --
 * which is what separates it from an empty pick, where the user turned every
 * option off and expects to see nothing.
 *
 * The options come from the data, so they change under the selection: a title
 * the source has stopped offering selects nothing and does not come back.
 */
export function selectedOptions(
	options: ListItemSpecType[],
	chosenTitles: string[] | null,
): ListItemSpecType[] {
	if (chosenTitles === null) {
		return options
	}

	return options.filter((option) => chosenTitles.includes(option.title))
}
