// @flow

import * as React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import _ from 'lodash'
import ColorHash from 'color-hash'
import tinycolor from 'tinycolor2'

const colorHash = new ColorHash()

import * as data from './data.js'

type Props = {}
type State = {}

const styles = StyleSheet.create({
	date: {
		fontWeight: 'bold',
	},
	title: {
		fontSize: 24,
	},
	time: {
		color: '#6a6a6a',
	},
	list: {
		alignItems: 'flex-start',
	}
})

export class TimelineView extends React.Component<Props, State> {
	render() {
		return (
			<ScrollView horizontal={false} showsVerticalScrollIndicator={true}>
				{data.days.map(({name, date, ongoing, allDay, events}) => {
					let byTime = _.toPairs(_.groupBy(events, ev => ev.start))

					return (
						<React.Fragment key={date}>
							<View style={{paddingLeft: 5}}>
							<Text style={styles.date}>{date}</Text>
							<Text style={styles.title}>{name}</Text>
						</View>

							<ScrollView horizontal contentContainerStyle={styles.list}>
								{ongoing.map((ev, i) => (
									<Event key={i} {...ev} />
								))}
							</ScrollView>

							<ScrollView horizontal contentContainerStyle={styles.list}>
								{allDay.map((ev, i) => (
									<Event key={i} {...ev} />
								))}
							</ScrollView>

							{byTime.map(([time, events]) => (
								<View key={time} style={{flexDirection: 'row', alignItems: 'flex-start'}}>
									<Text style={[styles.time, {width: 50, textAlign: 'right', paddingTop: 10, paddingRight: 5, paddingLeft: 5}]}>{time}</Text>
									<ScrollView horizontal contentContainerStyle={styles.list}>
										{events.map((ev, i) => (
											<Event key={i} {...ev} />
										))}
									</ScrollView>
								</View>
							))}
						</React.Fragment>
					)
				})}
			</ScrollView>
		)
	}
}

const card = StyleSheet.create({
	wrapper: {
		padding: 5,
		borderRadius: 5,
		margin: 5,
		borderStyle: 'solid',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: '#6a6a6a',
		width: 130,
	},
	title: {
		fontSize: 14,
	},
	location: {
		fontSize: 14,
	},
	detail: {
		fontSize: 14,
	},
})

function Event({start, title, duration, type, source, location}) {
	let bg = colorHash.hex(source)
	let fg = {
		color: tinycolor.mostReadable(bg, [], {includeFallbackColors: true}),
	}
	return (
		<View
			style={[
				card.wrapper,
				{
					backgroundColor: bg,
					borderColor: tinycolor(bg)
						.darken()
						.toString(),
				},
			]}
		>
			<Text numberOfLines={1} style={[card.title, fg]}>
				{title}
			</Text>
			{location && (
				<Text numberOfLines={1} style={[card.location, fg]}>
					{location}
				</Text>
			)}
			{duration && (
				<Text numberOfLines={1} style={[card.detail, fg]}>
					{duration} • {source}
				</Text>
			)}
		</View>
	)
}
