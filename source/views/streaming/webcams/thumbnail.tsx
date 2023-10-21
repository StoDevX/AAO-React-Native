import * as React from 'react'
import {Image, StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'
import {trackedOpenUrl} from '@frogpond/open-url'
import {Touchable} from '@frogpond/touchable'

import transparentPixel from '../../../../images/transparent.png'
import {images as webcamImages} from '../../../../images/webcams'
import type {Webcam} from './types'

type Props = {
	webcam: Webcam
	viewportWidth: number
}

export const StreamThumbnail = (props: Props): JSX.Element => {
	let handlePress = () => {
		let {name, pageUrl} = props.webcam
		trackedOpenUrl({url: pageUrl, id: `${name}WebcamView`})
	}

	let {viewportWidth, webcam} = props
	let {name, thumbnail, accentColor, textColor, thumbnailUrl} = webcam

	let [r, g, b] = accentColor
	let baseColor = `rgba(${r}, ${g}, ${b}, 1)`

	let width = viewportWidth / 2 - CELL_MARGIN * 1.5
	let cellRatio = 2.15625
	let height = width / cellRatio

	let img = thumbnailUrl
		? {uri: thumbnailUrl}
		: webcamImages.has(thumbnail)
		? webcamImages.get(thumbnail)
		: transparentPixel

	return (
		// do not remove this View; it is needed to prevent extra highlighting
		<Touchable
			containerStyle={styles.cell}
			highlight={true}
			onPress={handlePress}
			style={{width, height}}
			underlayColor={baseColor}
		>
			<Image
				accessibilityIgnoresInvertColors={true}
				resizeMode="cover"
				source={img}
				style={[StyleSheet.absoluteFill, {width, height}]}
			/>

			<View style={styles.titleWrapper}>
				<Text style={[styles.titleText, {color: textColor}]}>{name}</Text>
			</View>
		</Touchable>
	)
}

const CELL_MARGIN = 10
const styles = StyleSheet.create({
	cell: {
		overflow: 'hidden',
		margin: CELL_MARGIN / 2,
		borderRadius: 6,
	},
	titleWrapper: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	titleText: {
		backgroundColor: c.transparent,
		fontSize: 12,
		paddingHorizontal: 4,
		paddingVertical: 2,
		textAlign: 'center',
		fontWeight: 'bold',
	},
})
