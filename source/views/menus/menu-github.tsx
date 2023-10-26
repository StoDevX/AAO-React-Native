import * as React from 'react'

import {timezone} from '@frogpond/constants'
import {FoodMenu} from '@frogpond/food-menu'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {usePauseMenu} from './query'
import sample from 'lodash/sample'
import moment from 'moment-timezone'

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
			foodItems={data.foodItems}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={moment.tz(dataUpdatedAt, timezone())}
			onRefresh={refetch}
			refreshing={isRefetching}
		/>
	)
}
