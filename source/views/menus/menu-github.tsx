import * as React from 'react'
import {useState} from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import {usePauseMenu} from './query'

type Props = {
	name: string
	loadingMessage: string[]
}

export function GitHubHostedMenu(props: Props): JSX.Element {
	let {
		data = {
			foodItemsMap: {},
			meals: [],
			corIcons: {},
			now: moment.tz(timezone()),
		},
		error,
		isError,
		isLoading,
		refetch,
		isRefetching,
		dataUpdatedAt,
	} = usePauseMenu()

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
			foodItems={data.foodItemsMap}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={moment.tz(dataUpdatedAt, timezone())}
			onRefresh={refetch}
			refreshing={isRefetching}
		/>
	)
}
