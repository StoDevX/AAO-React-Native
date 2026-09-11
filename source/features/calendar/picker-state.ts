import type {CalendarFilter} from './store'

/**
 * What a collapsed submenu row reads.
 *
 * It names its axis, and names the selection too when that axis is the one
 * filtered -- otherwise the only way to see what the list is narrowed to is to
 * open both submenus. A filter on the other axis leaves this row bare, or two
 * rows would claim the same selection.
 */
export function axisLabel(
	axis: CalendarFilter['axis'],
	title: string,
	filter: CalendarFilter | null,
): string {
	return filter?.axis === axis ? `${title}: ${filter.value}` : title
}

/**
 * What choosing a value on an axis should leave the filter as.
 *
 * Choosing the one already filtered on clears it, which is what makes a row a
 * toggle rather than a one-way switch. Choosing anything else replaces whatever
 * was there, on either axis -- there is one selection between them, not one
 * each.
 */
export function filterAfterChoosing(
	filter: CalendarFilter | null,
	axis: CalendarFilter['axis'],
	value: string,
): CalendarFilter | null {
	let alreadyChosen = filter?.axis === axis && filter.value === value
	return alreadyChosen ? null : {axis, value}
}
