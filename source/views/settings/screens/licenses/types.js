// @flow

export type LicenseType = {
	key: string,
	username: string,
	licenses: string,
	name: string,
	version: string,
	repository: string,
	publisher: string,
	licenseText: string,
}

export type SortedLicenseType = {
	title: string,
	data: Array<LicenseType>,
}
