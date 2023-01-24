import * as React from 'react'
import {useCallback, useState} from 'react'
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
} from 'react-native'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../components/call-phone'
import {Row} from '@frogpond/layout'
import {StreamPlayer} from './player'
import type {HtmlAudioError, PlayState} from './types'
import {useTheme} from './theme'
import {ActionButton, CallButton, ShowCalendarButton} from './buttons'
import {openUrl} from '@frogpond/open-url'
import {useNavigation} from '@react-navigation/native'
import {RadioScheduleParamList} from '../../../navigation/types'

// If you want to fix the inline player, switch to `true`
const ALLOW_INLINE_PLAYER = false

type PlayButtonProps = {
	state: PlayState
	onPlay: () => unknown
	onPause: () => unknown
	onLink: () => unknown
}

function PlayButton(props: PlayButtonProps): JSX.Element {
	const {state, onPlay, onPause, onLink} = props

	if (!ALLOW_INLINE_PLAYER) {
		return <ActionButton icon="ios-planet" onPress={onLink} text="Open" />
	}

	switch (state) {
		case 'paused':
			return <ActionButton icon="ios-play" onPress={onPlay} text="Listen" />

		case 'checking':
			return (
				<ActionButton icon="code-working" onPress={onPause} text="Starting" />
			)

		case 'playing':
			return <ActionButton icon="ios-pause" onPress={onPlay} text="Pause" />

		default:
			return <ActionButton icon="ios-bug" onPress={noop} text="Error" />
	}
}

type Props = {
	image: number
	playerUrl: string
	stationNumber: string
	title: string
	scheduleViewName: keyof RadioScheduleParamList
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

export function RadioControllerView(props: Props): JSX.Element {
	const theme = useTheme()
	const {
		source,
		title,
		stationName,
		image,
		scheduleViewName,
		stationNumber,
		playerUrl,
	} = props

	let navigation = useNavigation()

	let [playState, setPlayState] = useState<PlayState>('paused')
	let [streamError, setStreamError] = useState<HtmlAudioError | null>(null)

	let play = () => {
		setPlayState('checking')
	}

	let pause = () => {
		setPlayState('paused')
	}

	let handleStreamPlay = () => {
		setPlayState('playing')
	}

	let handleStreamPause = () => {
		setPlayState('paused')
	}

	let handleStreamEnd = () => {
		setPlayState('paused')
	}

	let handleStreamError = (e: {code: number; message: string}) => {
		setStreamError(e)
		setPlayState('paused')
	}

	let openSchedule = useCallback(() => {
		navigation.navigate(scheduleViewName)
	}, [navigation, scheduleViewName])

	let callStation = useCallback(() => {
		callPhone(stationNumber, {title: stationName})
	}, [stationName, stationNumber])

	let openStreamWebsite = useCallback(() => {
		openUrl(playerUrl)
	}, [playerUrl])

	let error = streamError ? (
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
			<PlayButton
				onLink={openStreamWebsite}
				onPause={pause}
				onPlay={play}
				state={playState}
			/>
			<View style={styles.spacer} />
			<CallButton onPress={callStation} />
			<View style={styles.spacer} />
			<ShowCalendarButton onPress={openSchedule} />
		</Row>
	)

	let playerBlock = ALLOW_INLINE_PLAYER ? (
		<StreamPlayer
			embeddedPlayerUrl={source.embeddedPlayerUrl}
			onEnded={handleStreamEnd}
			// onWaiting={this.handleStreamWait}
			onError={handleStreamError}
			// onStalled={this.handleStreamStall}
			onPause={handleStreamPause}
			onPlay={handleStreamPlay}
			playState={playState}
			streamSourceUrl={source.streamSourceUrl}
			style={styles.webview}
			useEmbeddedPlayer={source.useEmbeddedPlayer}
		/>
	) : null

	let {width, height} = useWindowDimensions()

	let sideways = width > height

	let logoSmallestDimension = Math.min(width / 1.5, height / 1.75)
	let logoSize = {
		width: logoSmallestDimension,
		height: logoSmallestDimension,
	}

	let root = [styles.root, sideways && landscape.root]
	let logoBorderColor = {borderColor: theme.imageBorderColor}
	let logoBg = {backgroundColor: theme.imageBackgroundColor}
	let logo = [styles.logoBorder, logoSize, logoBorderColor, logoBg]
	let logoWrapper = [styles.logoWrapper, sideways && landscape.logoWrapper]

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
