// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {setSaturation, setLightness, darken, transparentize, rgb} from 'polished'
import type {MovieTrailer, RGBTuple} from '../types'
import LinearGradient from 'react-native-linear-gradient'

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

type Props = {
	trailer: MovieTrailer,
	tint: string,
	height: number,
	viewport: {
		width: number,
		height: number,
	},
}

export const TrailerBackground = (props: Props) => {
	const {trailer, tint: posterTint, height, viewport} = props

	// TODO: find the largest size beneath `ideal`
	const thumbnail = trailer.thumbnails.find(thm => thm.width === 640)

	// TODO: provide a fallback image
	const uri = thumbnail ? thumbnail.url : ''

	const tint = makeRgb(trailer.colors.dominant) || posterTint

	const gradient = [
		c.transparent,
		c.transparent,
		// c.transparent,
		// c.black,
		// setLightness(0.35, setSaturation(0.25, tint)),
		darken(0.1, transparentize(0.5, tint)),
	]

	return (
		<glamorous.View
			height={height}
			left={0}
			position="absolute"
			top={0}
			width={viewport.width}
		>
			<glamorous.Image
				resizeMode="cover"
				source={{uri}}
				style={StyleSheet.absoluteFill}
			/>

			<LinearGradient
				colors={gradient}
				locations={[0, 0.66, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<TriangleOverlay height={height / 2.5} width={viewport.width} />
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
