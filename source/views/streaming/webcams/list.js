// @flow

import * as React from 'react'
import {StyleSheet, ScrollView} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../../lib/partition-by-index'
import type {Webcam} from './types'
import {StreamThumbnail} from './thumbnail'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {Viewport} from '@frogpond/viewport'

const fetchWebcams = (): Promise<Array<Webcam>> =>
	fetch(API('/webcams'))
		.json()
		.then(body => body.data)

type Props = {}

type State = {
	webcams: Array<Webcam>,
	loading: boolean,
}

export class WebcamsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Webcams',
		tabBarIcon: TabBarIcon('videocam'),
	}

	state = {
		webcams: [],
		loading: false,
	}

	componentDidMount() {
		this.fetchData()
	}

	fetchData = async () => {
		this.setState(() => ({loading: true}))
		let webcams = await fetchWebcams()
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
