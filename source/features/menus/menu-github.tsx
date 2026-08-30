import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {useRouter} from 'expo-router'
import type {GithubMenuType} from './types'

type Props = {
	name: string
	loadingMessage: string[]
}

// Module-level so its identity is stable across renders. `useQuery` reports
// `data: undefined` while offline (`networkMode: 'online'` leaves `isLoading`
// false once the fetch is merely paused) and transiently during cold-launch
// cache restoration, so this default is live far more often than "no data
// yet" suggests -- a fresh object literal here would hand `FoodMenu` a new
// `corIcons` reference on every one of those renders.
const EMPTY_MENU: GithubMenuType = {foodItems: {}, meals: [], corIcons: {}}

export function GitHubHostedMenu(props: Props): React.ReactNode {
	let router = useRouter()

	let {
		data = EMPTY_MENU,
		error,
		isError,
		isLoading,
		refetch,
		dataUpdatedAt,
	} = useQuery(pauseMenuOptions)

	if (isLoading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<FoodMenu
			foodItems={data.foodItems}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={moment.tz(dataUpdatedAt, timezone())}
			onItemPress={(item) =>
				router.push({
					pathname: '/MenuItemDetail',
					params: {source: 'pause', itemId: item.id},
				})
			}
			onRefresh={refetch}
		/>
	)
}
