import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigKey, AppConfigGroupKey, FeatureFlagType} from './types'

export type {FeatureFlagType} from './types'

export const AppConfig = async (): Promise<FeatureFlagType[]> => {
	return [
		{
			configKey: AppConfigKey.MockStoprintData,
			group: AppConfigGroupKey.stoprint,
			title: 'Use mock data',
			active: await getFeatureFlag(AppConfigKey.MockStoprintData),
		},
	]
}
