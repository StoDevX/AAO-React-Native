import {getFeatureFlag} from '../../source/lib/storage'
import {AppConfigType, FeatureFlagType} from './types'
import {useQuery} from '@tanstack/react-query'
import {isDevMode} from '@frogpond/constants'

export type {AppConfigType, FeatureFlagType} from './types'

// helper method to query exported __DEV__ feature flags
export const useFeature = (featureKey: AppConfigType): boolean => {
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
			configKey: AppConfigType.Courses_ShowRecentSearchScreen,
			active: await getFeatureFlag(
				AppConfigType.Courses_ShowRecentSearchScreen,
			),
		},
	]
}

// exported feature flags
export const useCourseSearchRecentsScreen = (): boolean =>
	useFeature(AppConfigType.Courses_ShowRecentSearchScreen)
