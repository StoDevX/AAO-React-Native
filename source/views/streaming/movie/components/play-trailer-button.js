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

export const PlayTrailerButton = (props: {
	right: number,
	tint: string,
	trailer: MovieTrailer,
}) => {
	const {right, tint, trailer} = props
	const size = 50

	return (
		<Touchable
			underlayColor={darken(0.1, tint)}
			containerStyle={{
				marginRight: right,
				backgroundColor: tint,
				borderRadius: size,
				shadowColor: setLightness(0.35, setSaturation(0.15, props.tint)),
				shadowOffset: {height: 2, width: 0},
				shadowOpacity: 0.3,
			}}
			style={{
				height: size,
				width: size,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Icon
				name={Platform.OS === 'ios' ? 'ios-play' : 'md-play'}
				style={{
					color: c.white,
					fontSize: size * (3 / 5),
					textAlign: 'center',
				}}
			/>
		</Touchable>
	)
}
