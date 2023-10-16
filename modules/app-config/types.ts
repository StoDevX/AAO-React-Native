export interface FeatureFlagType {
	configKey: AppConfigKey
	title: string
	group: AppConfigGroupKey
	active: boolean
}

export enum AppConfigKey {
	TestDataKey = 'TestData',
}

export enum AppConfigGroupKey {
	test = 'test',
}
