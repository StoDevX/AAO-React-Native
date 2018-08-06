// @flow

import * as React from 'react'
import {StyleSheet, ScrollView} from 'react-native'
import delay from 'delay'
import {reportNetworkProblem} from '../../../lib/report-network-problem'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as defaultData from '../../../../docs/webcams.json'
import {Column} from '../../components/layout'
import {partitionByIndex} from '../../../lib/partition-by-index'
import type {Webcam} from './types'
import {StreamThumbnail} from './thumbnail'
import {GH_PAGES_URL} from '../../../globals'
import {Viewport} from '../../components/viewport'

const webcamsUrl = GH_PAGES_URL('webcams.json')

type Props = {}

type State = {
	webcams: Array<Webcam>,
	loading: boolean,
	refreshing: boolean,
}

export class WebcamsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Webcams',
		tabBarIcon: TabBarIcon('videocam'),
	}

	state = {
		webcams: defaultData.data,
		loading: false,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData()
	}

	refresh = async () => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	fetchData = async () => {
		this.setState(() => ({loading: true}))

		let {data: webcams} = await fetchJson(webcamsUrl).catch(err => {
			reportNetworkProblem(err)
			return defaultData
		})

		if (process.env.NODE_ENV === 'development') {
			webcams = defaultData.data
		}

		this.setState(() => ({webcams, loading: false}))
	}

	render() {
		const columns = partitionByIndex(this.state.webcams)

		return (
			<Viewport
				render={({width}) => (
					<ScrollView contentContainerStyle={styles.container}>
						{columns.map((contents, i) => (
							<Column key={i} style={styles.column}>
								{contents.map(webcam => (
									<StreamThumbnail
										key={webcam.name}
										viewportWidth={width}
										webcam={webcam}
									/>
								))}
							</Column>
						))}
					</ScrollView>
				)}
			/>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		padding: 5,
		flexDirection: 'row',
	},
	column: {
		flex: 1,
		alignItems: 'center',
	},
})
