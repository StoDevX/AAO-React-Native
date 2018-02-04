// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {Row, Column} from '../../../components/layout'
import type {MovieShowing, GroupedShowing} from '../types'
import {Card} from './parts'
import {groupShowings} from '../lib/group-showings'

export const Showings = ({showings}: {showings: ?Array<MovieShowing>}) => {
	if (!showings || !showings.length) {
		return <glamorous.Text>No Showings</glamorous.Text>
	}

	const grouped = groupShowings(showings)

	return (
		<glamorous.ScrollView
			horizontal={true}
			overflow="hidden"
			showsHorizontalScrollIndicator={false}
		>
			{grouped.map(s => <ShowingTile key={s.key} item={s} />)}
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

const ShowingTile = ({item}: {item: GroupedShowing}) => {
	return (
		<PaddedShowingsCard>
			<Row>
				<Column alignItems="center">
					<BigText>{item.date}</BigText>
					<SmallText>{item.month}</SmallText>
				</Column>
				<glamorous.View width={10} />
				<Column>
					<DimText lines={1}>{item.location}</DimText>
					<SmallText>{item.times.join(' • ')}</SmallText>
				</Column>
			</Row>
		</PaddedShowingsCard>
	)
}
