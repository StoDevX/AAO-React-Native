// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import moment from 'moment-timezone'
import glamorous from 'glamorous-native'
import {Row} from '../../../components/layout'
import type {MovieShowing} from '../types'
import {Card} from './parts'

const PaddedShowingsCard = ({children}) => (
	<Card marginHorizontal={10} marginVertical={16} paddingHorizontal={10}>
		{children}
	</Card>
)

export const Showings = ({showings}: {showings: ?Array<MovieShowing>}) => {
	if (!showings || !showings.length) {
		return <glamorous.Text>No Showings</glamorous.Text>
	}

	return (
		<glamorous.ScrollView
			horizontal={true}
			showsHorizontalScrollIndicator={false}
		>
			{showings.map(s => <ShowingTile key={s.time} item={s} />)}
		</glamorous.ScrollView>
	)
}

const ShowingsDay = glamorous.text({
	color: c.black,
	fontSize: 22,
})

const ShowingsLocation = glamorous.text({
	fontSize: 14,
})

const ShowingsTime = glamorous.text({
	color: c.black,
	fontSize: 13,
})

const ShowingTile = ({item}: {item: MovieShowing}) => (
	<PaddedShowingsCard>
		<Row alignItems="flex-start">
			<Row alignItems="flex-end" marginBottom={3}>
				<ShowingsDay lines={1}>{moment(item.time).format('D')}</ShowingsDay>
				<ShowingsLocation lines={1}>
					{item.location.toUpperCase()}
				</ShowingsLocation>
			</Row>
			<Row alignItems="flex-end">
				<ShowingsTime lines={1}>
					{moment(item.time)
						.format('MMM h:mmA')
						.toUpperCase()}
				</ShowingsTime>
			</Row>
		</Row>
	</PaddedShowingsCard>
)
