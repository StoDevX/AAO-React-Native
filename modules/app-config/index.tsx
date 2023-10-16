import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigKey, AppConfigGroupKey, FeatureFlagType} from './types'
import {useQuery} from '@tanstack/react-query'

export type {AppConfigKey, FeatureFlagType} from './types'

// datastore for the __DEV__ feature flags
export const AppConfig = async (): Promise<FeatureFlagType[]> => {
	return [
		{
			configKey: AppConfigKey.TestDataKey,
			group: AppConfigGroupKey.test,
			title: 'Test config key',
			active: await getFeatureFlag(AppConfigKey.TestDataKey),
		},
	]
}

// helper method to query exported __DEV__ feature flags
const useFeature = (featureKey: AppConfigKey): boolean => {
	let {data: featureValue = false} = useQuery({
		queryKey: ['app', 'app:feature-flag', featureKey],
		queryFn: () => getFeatureFlag(featureKey),
		onSuccess: (newValue) => {
			return newValue
		},
	})

	return featureValue
}

// exported feature flags
export const useTestFeature = (): boolean =>
	useFeature(AppConfigKey.TestDataKey)
