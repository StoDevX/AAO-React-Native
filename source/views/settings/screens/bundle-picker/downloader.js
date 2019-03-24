// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import delay from 'delay'
import {fetch} from '@frogpond/fetch'
import {CIRCLE_API_ARTIFACTS_URL} from '../../../../lib/constants'
import {refreshApp} from '../../../../lib/refresh'
import RNFS from 'react-native-fs'
import {
	setActiveBundle,
	registerBundle,
	reloadBundle,
} from 'react-native-dynamic-bundle'
import * as c from '@frogpond/colors'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import type {NavigationScreenProp} from 'react-navigation'
import type {CircleArtifact} from './types'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	title: {
		fontSize: 26,
		textAlign: 'left',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

type Props = {
	navigation: NavigationScreenProp<*> & {
		state: {params: {request: any}},
	},
}

type State = {
	circleResponse: ?Array<CircleArtifact>,
	loading: boolean,
	error: boolean,
}

export class DownloaderView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Update',
	}

	state = {
		circleResponse: null,
		loading: true,
		error: false,
	}

	componentDidMount() {
		this.fetchCirlceData()
			.then(() => {
				this.setState(() => ({loading: false}))
			})
			.catch(() => {
				this.setState(() => ({loading: false, error: true}))
			})
	}

	onDownloadPushed = () => {
		this.downloadBundle()
		this.replaceBundle()
	}

	fetchCirlceData = async () => {
		const request = this.props.navigation.state.params.request

		let circleResponse = await fetch(CIRCLE_API_ARTIFACTS_URL, {
			searchParams: {
				branch: request.head.ref,
			},
		}).json()

		let start = Date.now()
		// wait 1 second – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 1000) {
			await delay(1000 - elapsed)
		}

		this.setState(() => ({circleResponse: circleResponse, error: false}))
	}

	downloadBundle = async () => {
		let {circleResponse} = this.state

		if (!this.state.error && circleResponse && circleResponse[0].url) {
			await RNFS.downloadFile({
				fromUrl: circleResponse[0].url,
				toFile: `${RNFS.DocumentDirectoryPath}/test.bundle`,
			})
		}
	}

	replaceBundle = () => {
		registerBundle('test', 'test.bundle')
		setActiveBundle('test')
		reloadBundle()
		refreshApp()
	}

	render() {
		const {request} = this.props.navigation.state.params
		const {circleResponse, loading, error} = this.state

		return (
			<ScrollView style={styles.container}>
				<Text selectable={true} style={styles.title}>
					{request.title}
				</Text>

				{loading ? (
					<Button disabled={true} title="Checking for artifacts…" />
				) : !error ? (
					<Button
						disabled={circleResponse && !circleResponse.length}
						onPress={this.onDownloadPushed}
						title={
							circleResponse && circleResponse.length
								? 'Update'
								: 'No artifacts found'
						}
					/>
				) : (
					<Button disabled={true} title="Error in checking for artifacts" />
				)}

				<Button
					onPress={() => openUrl(request.html_url)}
					title="Open in browser"
				/>
			</ScrollView>
		)
	}
}
