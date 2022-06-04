import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigKey, FeatureFlagSectionType} from './types'

export type {
	FeatureFlagSectionType,
	FeatureFlagDataType,
	FeatureFlagType,
} from './types'

export {AppConfigKey} from './types'

export const AppConfig: FeatureFlagSectionType[] = [
	{
		title: 'Directory',
		data: [
			{
				title: 'React Native',
				data: [
					{
						configKey: AppConfigKey.ReactNativeDirectory,
						title: 'RN Directory',
						active: getFeatureFlag(AppConfigKey.ReactNativeDirectory),
					},
				],
			},
		],
	},
	{
		title: 'StoPrint',
		data: [
			{
				title: 'Mock data',
				data: [
					{
						configKey: AppConfigKey.MockStoprintData,
						title: 'Show mocked data',
						active: getFeatureFlag(AppConfigKey.MockStoprintData),
					},
				],
			},
		],
	},
].sort((a, b) => a.title.localeCompare(b.title))
