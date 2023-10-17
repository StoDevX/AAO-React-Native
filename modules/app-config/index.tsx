import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigKey, FeatureFlagType} from './types'
import {useQuery} from '@tanstack/react-query'
import {isDevMode} from '@frogpond/constants'

export type {AppConfigKey, FeatureFlagType} from './types'

// helper method to query exported __DEV__ feature flags
const useFeature = (featureKey: AppConfigKey): boolean => {
	let {data: featureValue = false} = useQuery({
		queryKey: ['app', 'app:feature-flag', featureKey],
		queryFn: () => getFeatureFlag(featureKey),
		onSuccess: (newValue) => {
			return isDevMode() ? newValue : false
		},
	})

	return isDevMode() ? featureValue : false
}

// datastore for the __DEV__ feature flags
export const AppConfig = async (): Promise<FeatureFlagType[]> => {
	return [
		{
			title: 'Show the course search recents screen',
			configKey: AppConfigKey.Courses_ShowRecentSearchScreen,
			active: await getFeatureFlag(AppConfigKey.Courses_ShowRecentSearchScreen),
		},
	]
}

// exported feature flags
export const useCourseSearchRecentsScreen = (): boolean =>
	useFeature(AppConfigKey.Courses_ShowRecentSearchScreen)
