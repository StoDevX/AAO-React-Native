import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {useRouter} from 'expo-router'

type Props = {
	name: string
	loadingMessage: string[]
}

export function GitHubHostedMenu(props: Props): React.ReactNode {
	let router = useRouter()

	let {
		data = {foodItems: {}, meals: [], corIcons: {}},
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
