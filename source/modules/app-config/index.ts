import {getFeatureFlag} from '../../lib/storage'
import {AppConfigEntry, FeatureFlag} from './types'
import {useQuery} from '@tanstack/react-query'
import {isDevMode} from '../constants'

export type {AppConfigEntry, FeatureFlag} from './types'

// helper method to query exported __DEV__ feature flags
export const useFeature = (featureKey: AppConfigEntry): boolean => {
	let {data: featureValue = false} = useQuery({
		queryKey: ['app', 'app:feature-flag', featureKey],
		queryFn: () => getFeatureFlag(featureKey),
	})

	return isDevMode() ? featureValue : false
}

// datastore for the __DEV__ feature flags
export const AppConfig = async (): Promise<FeatureFlag[]> => {
	if (!isDevMode()) {
		return []
	}

	return [
		{
			title: 'Show the course search recents screen',
			configKey: AppConfigEntry.Courses_ShowRecentSearchScreen,
			active: await getFeatureFlag(
				AppConfigEntry.Courses_ShowRecentSearchScreen,
			),
		},
	]
}

// exported feature flags
export const useCourseSearchRecentsScreen = (): boolean =>
	useFeature(AppConfigEntry.Courses_ShowRecentSearchScreen)
