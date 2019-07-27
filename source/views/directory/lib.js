// @flow


export const officeHoursTitle = (officeHours: OfficeHours) => {
	let content = officeHours.content || ''
	let label = officeHours.hrefLabel || ''

	return `${content} ${label}`
}



}
