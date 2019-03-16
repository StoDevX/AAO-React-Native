// @flow

import * as React from 'react'
import {Image, ScrollView, StyleSheet, Text, View, Platform} from 'react-native'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../components/call-phone'
import {Row} from '@frogpond/layout'
import type {TopLevelViewPropsType} from '../../types'
import {StreamPlayer} from './player'
import type {PlayState, HtmlAudioError, PlayerTheme} from './types'
import {ActionButton, ShowCalendarButton, CallButton} from './buttons'
import {openUrl} from '@frogpond/open-url'
import {useViewport} from '@frogpond/viewport'

const useState = React.useState

type Props = TopLevelViewPropsType & {
	colors: PlayerTheme,
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

export function RadioControllerView(props: Props) {
	const {source, title, stationName, image, colors} = props

	let [playState, setPlayState]: [PlayState, *] = useState('paused')
	let [streamError, setStreamError]: [?HtmlAudioError, *] = useState(null)
	let [uplinkError, _setUplinkError]: [?string, *] = useState(null)
	let {width, height} = useViewport()

	let play = () => setPlayState('checking')
	let pause = () => setPlayState('paused')
	let handleStreamPlay = () => setPlayState('playing')
	let handleStreamPause = () => setPlayState('paused')
	let handleStreamEnd = () => setPlayState('paused')

	let handleStreamError = (e: {code: number, message: string}) => {
		setStreamError(e)
		setPlayState('paused')
	}

	let openSchedule = () => {
		props.navigation.navigate(props.scheduleViewName)
	}

	let callStation = () => callPhone(props.stationNumber)

	let openStreamWebsite = () => openUrl(props.playerUrl)

	let playButton = () => {
		let Button = ({icon, onPress, text}) => (
			<ActionButton colors={colors} icon={icon} onPress={onPress} text={text} />
		)

		if (Platform.OS === 'android') {
			return (
				<Button icon="ios-planet" onPress={openStreamWebsite} text="Open" />
			)
		}

		switch (playState) {
			case 'paused':
				return <Button icon="ios-play" onPress={play} text="Listen" />

			case 'checking':
				return <Button icon="ios-more" onPress={pause} text="Starting" />

			case 'playing':
				return <Button icon="ios-pause" onPress={pause} text="Pause" />

			default:
				return <Button icon="ios-bug" onPress={noop} text="Error" />
		}
	}

	const error = uplinkError ? (
		<Text style={styles.status}>{uplinkError}</Text>
	) : streamError ? (
		<Text style={styles.status}>
			Error Code {streamError.code}: {streamError.message}
		</Text>
	) : null

	let textColor = {color: colors.textColor}
	const titleBlock = (
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

	const controlsBlock = (
		<Row>
			{playButton}
			<View style={styles.spacer} />
			<CallButton colors={props.colors} onPress={callStation} />
			<View style={styles.spacer} />
			<ShowCalendarButton colors={props.colors} onPress={openSchedule} />
		</Row>
	)

	const playerBlock =
		Platform.OS !== 'android' ? (
			<StreamPlayer
				embeddedPlayerUrl={source.embeddedPlayerUrl}
				onEnded={handleStreamEnd}
				// onWaiting={handleStreamWait}
				onError={handleStreamError}
				// onStalled={handleStreamStall}
				onPause={handleStreamPause}
				onPlay={handleStreamPlay}
				playState={playState}
				streamSourceUrl={source.streamSourceUrl}
				style={styles.webview}
				useEmbeddedPlayer={source.useEmbeddedPlayer}
			/>
		) : null

	const sideways = width > height

	const logoWidth = Math.min(width / 1.5, height / 1.75)
	const logoSize = {width: logoWidth, height: logoWidth}

	const root = [styles.root, sideways && landscape.root]
	const logoBorderColor = {borderColor: colors.imageBorderColor}
	const logoBg = {backgroundColor: colors.imageBackgroundColor}
	const logo = [styles.logoBorder, logoSize, logoBorderColor, logoBg]
	const logoWrapper = [styles.logoWrapper, sideways && landscape.logoWrapper]

	return (
		<ScrollView contentContainerStyle={root}>
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
