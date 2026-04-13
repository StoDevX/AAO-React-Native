import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import {fromEpochMs} from '../../lib/temporal'
import sample from 'lodash/sample'
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'

type Props = {
	name: string
	loadingMessage: string[]
}

export function GitHubHostedMenu(props: Props): JSX.Element {
	let {
		data = {foodItems: {}, meals: [], corIcons: {}},
		error,
		isError,
		isLoading,
		refetch,
		isRefetching,
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
			now={fromEpochMs(dataUpdatedAt, timezone())}
			onRefresh={refetch}
			refreshing={isRefetching}
		/>
	)
}
