export interface FeatureFlagType {
	configKey: AppConfigKey
	title: string
	group: AppConfigGroupKey
	active: boolean
}

export enum AppConfigKey {
	MockStoprintData = 'MockStoprintData',
}

export enum AppConfigGroupKey {
	stoprint = 'stoPrint',
}
