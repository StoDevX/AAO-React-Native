export interface FeatureFlagSectionType {
	title: string
	data: FeatureFlagDataType[]
}

export interface FeatureFlagDataType {
	title: string
	data: FeatureFlagType[]
}

export interface FeatureFlagType {
	configKey: AppConfigKey
	title: string
	active: boolean
}

export enum AppConfigKey {
	MockStoprintData = 'MockStoprintData',
}
