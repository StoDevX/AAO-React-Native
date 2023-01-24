import type {ContactPersonType} from './types'

export function showNameOrEmail(c: ContactPersonType): string {
	if (!c.firstName.trim() && !c.lastName.trim()) {
		return `${c.email}`
	}

	return `${c.firstName} ${c.lastName}`
}
