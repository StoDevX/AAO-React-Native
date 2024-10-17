import * as React from 'react'
import {timezone} from '../../modules/constants'
import {LoadingView, NoticeView} from '../../modules/notice'
import {FoodMenu} from '../../modules/food-menu'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import {usePauseMenu} from './query'

interface Props {
	name: string
	loadingMessage: string[]
}

export function GitHubHostedMenu(props: Props): React.JSX.Element {
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
				text={`A problem occured while loading: ${String(error)}`}
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
