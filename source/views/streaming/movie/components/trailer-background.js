// @flow

import * as React from 'react'
import {StyleSheet, Dimensions} from 'react-native'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {setSaturation, setLightness} from 'polished'
import type {MovieTrailer} from '../types'

import LinearGradient from 'react-native-linear-gradient'

type Props = {
	trailer: MovieTrailer,
	tint: string,
	height: number,
}

export const TrailerBackground = (props: Props) => {
	const {trailer, tint, height} = props

	// TODO: find the largest size beneath `ideal`
	const thumbnail = trailer.thumbnails.find(thm => thm.width === 640)

	// TODO: provide a fallback image
	const uri = thumbnail ? thumbnail.url : ''

	const gradient = [
		c.transparent,
		c.transparent,
		setLightness(0.35, setSaturation(0.25, tint)),
		// darken(0.2, transparentize(0, tint)),
	]

	return (
		<glamorous.View>
			<glamorous.Image
				height={height}
				resizeMode="cover"
				source={{uri}}
				width={Dimensions.get('window').width}
			/>

			<LinearGradient
				colors={gradient}
				locations={[0, 0.66, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<TriangleOverlay
				height={height / 2.5}
				width={Dimensions.get('window').width}
			/>
		</glamorous.View>
	)
}

type TriangleOverlayProps = {
	height: number,
	width: number,
}

const TriangleOverlay = ({height, width}: TriangleOverlayProps) => {
	return (
		<glamorous.View
			backgroundColor="transparent"
			borderBottomColor="#fff"
			borderBottomWidth={height}
			borderLeftColor="transparent"
			borderLeftWidth={0}
			borderRightColor="transparent"
			borderRightWidth={width}
			borderStyle="solid"
			bottom={0}
			height={0}
			position="absolute"
			right={0}
			width={0}
		/>
	)
}
