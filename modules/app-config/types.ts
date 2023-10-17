export interface FeatureFlagType {
	configKey: AppConfigKey
	title: string
	active: boolean
}

export enum AppConfigKey {
	TestDataKey = 'TestData',
}

}
