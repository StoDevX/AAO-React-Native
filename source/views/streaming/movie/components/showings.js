// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import moment from 'moment-timezone'
import glamorous from 'glamorous-native'
import {Row, Column} from '../../../components/layout'
import type {MovieShowing} from '../types'
import {Card} from './parts'

export const Showings = ({showings}: {showings: ?Array<MovieShowing>}) => {
	if (!showings || !showings.length) {
		return <glamorous.Text>No Showings</glamorous.Text>
	}

	return (
		<glamorous.ScrollView
			horizontal={true}
			overflow="hidden"
			showsHorizontalScrollIndicator={false}
		>
			{showings.map(s => <ShowingTile key={s.time} item={s} />)}
		</glamorous.ScrollView>
	)
}

const PaddedShowingsCard = ({children}) => (
	<Card
		marginHorizontal={10}
		marginVertical={16}
		paddingBottom={8}
		paddingHorizontal={10}
		paddingTop={10}
	>
		{children}
	</Card>
)

const BigText = glamorous.text({
	color: c.black,
	fontSize: 22,
	lineHeight: 22,
})

const DimText = glamorous.text({
	color: c.iosDisabledText,
	fontSize: 14,
	lineHeight: 22,
})

const SmallText = glamorous.text({
	color: c.black,
	fontSize: 13,
	fontVariant: ['small-caps'],
})

const ShowingTile = ({item}: {item: MovieShowing}) => {
	const m = moment(item.time)

	const date = m.format('D')
	const month = m.format('MMM').toLowerCase()

	const time =
		m.minutes() === 0
			? m.format('hA').toLowerCase()
			: m.format('h:mmA').toLowerCase()

	const location = item.location

	return (
		<PaddedShowingsCard>
			<Row>
				<Column alignItems="center">
					<BigText>{date}</BigText>
					<SmallText>{month}</SmallText>
				</Column>
				<glamorous.View width={10} />
				<Column>
					<DimText lines={1}>{location}</DimText>
					<SmallText>{time}</SmallText>
				</Column>
			</Row>
		</PaddedShowingsCard>
	)
}
