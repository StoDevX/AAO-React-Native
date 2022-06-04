import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigKey, FeatureFlagSectionType} from './types'

export type {
	FeatureFlagSectionType,
	FeatureFlagDataType,
	FeatureFlagType,
} from './types'

export {AppConfigKey} from './types'

export const AppConfig = async (): Promise<FeatureFlagSectionType[]> => {
	return [
		{
			title: 'Directory',
			data: [
				{
					title: 'React Native',
					data: [
						{
							configKey: AppConfigKey.ReactNativeDirectory,
							title: 'RN Directory',
							active: await getFeatureFlag(AppConfigKey.ReactNativeDirectory),
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
							active: await getFeatureFlag(AppConfigKey.MockStoprintData),
						},
					],
				},
			],
		},
	].sort((a, b) => a.title.localeCompare(b.title))
}
