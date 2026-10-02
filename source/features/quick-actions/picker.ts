import {MAX_QUICK_ACTIONS} from './destinations'

/**
 * Whether the picker row for `id` can be tapped, given the resolved ids
 * already picked: always, to unpick; otherwise only while a slot is free.
 */
export function isPickable(id: string, picked: string[]): boolean {
	return picked.includes(id) || picked.length < MAX_QUICK_ACTIONS
}
