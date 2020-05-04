// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import glamorous from 'glamorous-native'
import {darken, transparentize, rgb} from 'polished'
import type {Movie, MovieTrailerThumbnail, RGBTuple} from '../types'
import LinearGradient from 'react-native-linear-gradient'
import {useViewport} from '@frogpond/viewport'

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

type Props = {
	movie: Movie,
	background: ?MovieTrailerThumbnail,
	tint: string,
	height: number,
}

export const TrailerBackground = (props: Props) => {
	const {movie, background, tint: posterTint, height} = props
	const viewport = useViewport()

	// TODO: provide a fallback image
	const uri = background ? background.url : ''

	const tint = makeRgb(movie.poster.colors.dominant) || posterTint

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
