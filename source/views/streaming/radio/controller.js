// @flow

import * as React from 'react'
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	Platform,
} from 'react-native'
import noop from 'lodash/noop'
import {
	trackStreamPlay,
	trackStreamPause,
	trackStreamError,
} from '../../../analytics'
import * as c from '../../components/colors'
import {callPhone} from '../../components/call-phone'
import {Row} from '../../components/layout'
import type {TopLevelViewPropsType} from '../../types'
import {StreamPlayer} from './player'
import type {PlayState, HtmlAudioError, Viewport} from './types'
import {ActionButton, ShowCalendarButton, CallButton} from './buttons'
import {openUrl} from '../../components/open-url'

type Props = TopLevelViewPropsType & {
	image: number,
	playerUrl: string,
	stationNumber: string,
	title: string,
	scheduleViewName: string,
	stationName: string,
	source: {
		useEmbeddedPlayer: boolean,
		embeddedPlayerUrl: string,
		streamSourceUrl: string,
	},
}

type State = {
	playState: PlayState,
	streamError: ?HtmlAudioError,
	uplinkError: ?string,
	viewport: Viewport,
}

export class RadioControllerView extends React.PureComponent<Props, State> {
	state = {
		playState: 'paused',
		streamError: null,
		uplinkError: null,
		viewport: Dimensions.get('window'),
	}

	componentWillMount() {
		Dimensions.addEventListener('change', this.handleResizeEvent)
	}

	componentWillUnmount() {
		Dimensions.removeEventListener('change', this.handleResizeEvent)
	}

	handleResizeEvent = (event: {window: {width: number, height: number}}) => {
		this.setState(() => ({viewport: event.window}))
	}

	play = () => {
		this.setState(() => ({playState: 'checking'}))
	}

	pause = () => {
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamPlay = () => {
		trackStreamPlay(this.props.stationName)
		this.setState(() => ({playState: 'playing'}))
	}

	handleStreamPause = () => {
		trackStreamPause(this.props.stationName)
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamEnd = () => {
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamError = (e: {code: number, message: string}) => {
		trackStreamError(this.props.stationName)
		this.setState(() => ({streamError: e, playState: 'paused'}))
	}

	openSchedule = () => {
		this.props.navigation.navigate(this.props.scheduleViewName)
	}

	callStation = () => {
		callPhone(this.props.stationNumber)
	}

	openStreamWebsite = () => {
		openUrl(this.props.playerUrl)
	}

	renderPlayButton = (state: PlayState) => {
		if (Platform.OS === 'android') {
			return (
				<ActionButton
					icon="ios-planet"
					onPress={this.openStreamWebsite}
					text="Open"
				/>
			)
		}

		switch (state) {
			case 'paused':
				return (
					<ActionButton icon="ios-play" onPress={this.play} text="Listen" />
				)

			case 'checking':
				return (
					<ActionButton icon="ios-more" onPress={this.pause} text="Starting" />
				)

			case 'playing':
				return (
					<ActionButton icon="ios-pause" onPress={this.pause} text="Pause" />
				)

			default:
				return <ActionButton icon="ios-bug" onPress={noop} text="Error" />
		}
	}

	render() {
		const sideways = this.state.viewport.width > this.state.viewport.height

		const logoWidth = Math.min(
			this.state.viewport.width / 1.5,
			this.state.viewport.height / 1.75,
		)

		const logoSize = {
			width: logoWidth,
			height: logoWidth,
		}

		const error = this.state.uplinkError ? (
			<Text style={styles.status}>{this.state.uplinkError}</Text>
		) : this.state.streamError ? (
			<Text style={styles.status}>
				Error Code {this.state.streamError.code}:{' '}
				{this.state.streamError.message}
			</Text>
		) : null

		return (
			<ScrollView
				contentContainerStyle={[styles.root, sideways && landscape.root]}
			>
				<View style={[styles.logoWrapper, sideways && landscape.logoWrapper]}>
					<Image
						resizeMode="contain"
						source={this.props.image}
						style={[styles.logo, logoSize]}
					/>
				</View>

				<View style={styles.container}>
					<View style={styles.titleWrapper}>
						<Text selectable={true} style={styles.heading}>
							{this.props.title}
						</Text>
						<Text selectable={true} style={styles.subHeading}>
							{this.props.stationName}
						</Text>

						{error}
					</View>

					<Row>
						{this.renderPlayButton(this.state.playState)}
						<View style={styles.spacer} />
						<CallButton onPress={this.callStation} />
						<View style={styles.spacer} />
						<ShowCalendarButton onPress={this.openSchedule} />
					</Row>

					{Platform.OS !== 'android' ? (
						<StreamPlayer
							embeddedPlayerUrl={this.props.source.embeddedPlayerUrl}
							onEnded={this.handleStreamEnd}
							// onWaiting={this.handleStreamWait}
							onError={this.handleStreamError}
							// onStalled={this.handleStreamStall}
							onPause={this.handleStreamPause}
							onPlay={this.handleStreamPlay}
							playState={this.state.playState}
							streamSourceUrl={this.props.source.streamSourceUrl}
							style={styles.webview}
							useEmbeddedPlayer={this.props.source.useEmbeddedPlayer}
						/>
					) : null}
				</View>
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'column',
		alignItems: 'stretch',
		justifyContent: 'space-between',
		padding: 20,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		marginTop: 20,
		marginBottom: 20,
	},
	logoWrapper: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	logo: {
		borderRadius: 6,
		borderColor: c.kstoSecondaryDark,
		borderWidth: 3,
	},
	titleWrapper: {
		alignItems: 'center',
		marginBottom: 20,
	},
	heading: {
		color: c.kstoPrimaryDark,
		fontWeight: '600',
		fontSize: 28,
		textAlign: 'center',
	},
	subHeading: {
		marginTop: 5,
		color: c.kstoPrimaryDark,
		fontWeight: '300',
		fontSize: 28,
		textAlign: 'center',
	},
	status: {
		fontWeight: '400',
		fontSize: 18,
		textAlign: 'center',
		color: c.grapefruit,
		marginTop: 15,
		marginBottom: 5,
	},
	webview: {
		display: 'none',
	},
	spacer: {
		width: 5,
	},
})

const landscape = StyleSheet.create({
	root: {
		flex: 1,
		padding: 20,
		flexDirection: 'row',
		alignItems: 'center',
	},
	logoWrapper: {
		flex: 0,
	},
})
