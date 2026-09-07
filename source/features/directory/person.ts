import type {DirectoryItem} from './types'

/**
 * A person's initials for the no-photo tile: the first letter of the first and
 * last name, or the first two non-space characters of the display name when a
 * name part is missing.
 */
export function initials(
	person: Pick<DirectoryItem, 'firstName' | 'lastName' | 'displayName'>,
): string {
	let first = person.firstName?.trim()?.[0] ?? ''
	let last = person.lastName?.trim()?.[0] ?? ''
	if (first && last) {
		return (first + last).toUpperCase()
	}
	return person.displayName.replace(/\s/gu, '').slice(0, 2).toUpperCase()
}
