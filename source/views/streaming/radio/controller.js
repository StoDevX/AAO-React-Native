// @flow

import * as React from 'react'
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../components/call-phone'
import {Row} from '@frogpond/layout'
import type {TopLevelViewPropsType} from '../../types'
import {StreamPlayer} from './player'
import type {PlayState, HtmlAudioError, PlayerTheme} from './types'
import {ActionButton, ShowCalendarButton, CallButton} from './buttons'
import {openUrl} from '@frogpond/open-url'
import {Viewport} from '@frogpond/viewport'
import {withTheme} from '@frogpond/app-theme'

// If you want to fix the inline player, switch to `true`
const ALLOW_INLINE_PLAYER = false

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
	testID: ?string,
	theme: PlayerTheme,
}

type State = {
	playState: PlayState,
	streamError: ?HtmlAudioError,
	uplinkError: ?string,
}

class RadioControllerView extends React.Component<Props, State> {
	state = {
		playState: 'paused',
		streamError: null,
		uplinkError: null,
	}

	play = () => {
		this.setState(() => ({playState: 'checking'}))
	}

	pause = () => {
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamPlay = () => {
		this.setState(() => ({playState: 'playing'}))
	}

	handleStreamPause = () => {
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamEnd = () => {
		this.setState(() => ({playState: 'paused'}))
	}

	handleStreamError = (e: {code: number, message: string}) => {
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
		if (!ALLOW_INLINE_PLAYER) {
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
		let {source, title, stationName, image, testID, theme} = this.props
		let {uplinkError, streamError, playState} = this.state

		let error = uplinkError ? (
			<Text style={styles.status}>{uplinkError}</Text>
		) : streamError ? (
			<Text style={styles.status}>
				Error Code {streamError.code}: {streamError.message}
			</Text>
		) : null

		let textColor = {color: theme.textColor}
		let titleBlock = (
			<View style={styles.titleWrapper}>
				<Text selectable={true} style={[styles.heading, textColor]}>
					{title}
				</Text>
				<Text selectable={true} style={[styles.subHeading, textColor]}>
					{stationName}
				</Text>

				{error}
			</View>
		)

		let controlsBlock = (
			<Row>
				{this.renderPlayButton(playState)}
				<View style={styles.spacer} />
				<CallButton onPress={this.callStation} />
				<View style={styles.spacer} />
				<ShowCalendarButton onPress={this.openSchedule} />
			</Row>
		)

		let playerBlock = ALLOW_INLINE_PLAYER ? (
			<StreamPlayer
				embeddedPlayerUrl={source.embeddedPlayerUrl}
				onEnded={this.handleStreamEnd}
				// onWaiting={this.handleStreamWait}
				onError={this.handleStreamError}
				// onStalled={this.handleStreamStall}
				onPause={this.handleStreamPause}
				onPlay={this.handleStreamPlay}
				playState={playState}
				streamSourceUrl={source.streamSourceUrl}
				style={styles.webview}
				useEmbeddedPlayer={source.useEmbeddedPlayer}
			/>
		) : null

		return (
			<Viewport
				render={({width, height}) => {
					let sideways = width > height

					let logoWidth = Math.min(width / 1.5, height / 1.75)
					let logoSize = {width: logoWidth, height: logoWidth}

					let root = [styles.root, sideways && landscape.root]
					let logoBorderColor = {borderColor: theme.imageBorderColor}
					let logoBg = {backgroundColor: theme.imageBackgroundColor}
					let logo = [styles.logoBorder, logoSize, logoBorderColor, logoBg]
					let logoWrapper = [
						styles.logoWrapper,
						sideways && landscape.logoWrapper,
					]

					return (
						<ScrollView contentContainerStyle={root} testID={testID}>
							<View style={logoWrapper}>
								<Image resizeMode="contain" source={image} style={logo} />
							</View>

							<View style={styles.container}>
								{titleBlock}
								{controlsBlock}
								{playerBlock}
							</View>
						</ScrollView>
					)
				}}
			/>
		)
	}
}

const ThemedRadioControllerView = withTheme(RadioControllerView)

export {ThemedRadioControllerView as RadioControllerView}

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
	logoBorder: {
		borderRadius: 6,
		borderColor: c.black,
		borderWidth: 3,
	},
	titleWrapper: {
		alignItems: 'center',
		marginBottom: 20,
	},
	heading: {
		color: c.black,
		fontWeight: '600',
		fontSize: 28,
		textAlign: 'center',
	},
	subHeading: {
		marginTop: 5,
		color: c.black,
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
