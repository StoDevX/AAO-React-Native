// @flow

import type {OfficeHours, OnLeave} from './types'

export const officeHoursTitle = (officeHours: OfficeHours) => {
	let content = officeHours.content || ''
	let label = officeHours.hrefLabel || ''

	return `${content} ${label}`
}

export const officeHoursLabel = (
	officeHours: OfficeHours,
	onLeave: ?OnLeave,
) => {
	const prefix = officeHours.prefix || ''
	const content = officeHours.content || ''

	const sabbaticalTitle = () => {
		const leaveType = (onLeave && onLeave.type) || ''
		return /sabbatical/u.test(leaveType)
	}

	if (prefix) {
		return prefix.substring(0, prefix.length - 1)
	} else if (onLeave && sabbaticalTitle()) {
		return 'On Leave'
	} else {
		return content
	}
}
