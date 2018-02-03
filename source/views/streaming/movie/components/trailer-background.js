// @flow

import * as React from 'react'
import {
	StyleSheet,
	FlatList,
	ScrollView,
	Dimensions,
	Platform,
} from 'react-native'
import {connect} from 'react-redux'
import {getWeeklyMovie} from '../../../flux/parts/weekly-movie'
import {type ReduxState} from '../../../flux'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'
import moment from 'moment-timezone'
import openUrl from '../../components/open-url'
import glamorous from 'glamorous-native'
import {type TopLevelViewPropsType} from '../../types'
import {Row, Column} from '../../components/layout'
import {human, material} from 'react-native-typography'
import {darken, setSaturation, setLightness, rgb} from 'polished'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import type {
	Movie,
	MovieShowing,
	MovieRating,
	PosterInfo,
	RGBTuple,
	MovieTrailer,
} from './types'

import LinearGradient from 'react-native-linear-gradient'

export const TrailerBackground = (props: {
	trailer: MovieTrailer,
	tint: string,
	height: number,
}) => {
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

const TriangleOverlay = ({height, width}: {height: number, width: number}) => {
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
