// @flow

import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import * as c from '../../../components/colors'
import openUrl from '../../../components/open-url'
import {darken, setSaturation, setLightness} from 'polished'
import {Touchable} from '../../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import type {MovieTrailer} from '../types'

const styles = StyleSheet.create({
	container: {
		shadowOffset: {
			height: 2,
			width: 0,
		},
		shadowOpacity: 0.3,
	},
	inner: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		color: c.white,
		textAlign: 'center',
	},
})

type Props = {
	right: number,
	tint: string,
	trailer: MovieTrailer,
}

export const PlayTrailerButton = ({right, tint, trailer}: Props) => {
	const size = 50

	const containerStyle = [
		styles.container,
		{
			marginRight: right,
			backgroundColor: tint,
			borderRadius: size,
			shadowColor: setLightness(0.35, setSaturation(0.15, tint)),
		},
	]

	const innerStyle = [styles.inner, {height: size, width: size}]

	const iconName = Platform.OS === 'ios' ? 'ios-play' : 'md-play'
	const iconStyle = [styles.icon, {fontSize: size * (3 / 5)}]

	return (
		<Touchable
			containerStyle={containerStyle}
			style={innerStyle}
			underlayColor={darken(0.1, tint)}
		>
			<Icon name={iconName} style={iconStyle} />
		</Touchable>
	)
}
