// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {setSaturation, setLightness} from 'polished'
import type {PosterInfo} from '../types'
import {ShrinkWhenTouched} from './parts'

type PosterProps = {
	sizes: Array<PosterInfo>,
	ideal: number,
	tint: string,
	onPress: () => any,
	viewport: {
		width: number,
		height: number,
	},
}

const PosterImage = (props: PosterProps) => {
	const {sizes, ideal, viewport} = props

	const landscape = viewport.width > viewport.height
	const width = landscape
		? Math.min(viewport.height / 2, 200)
		: Math.min(viewport.width / 3, 300)
	const ratio = 1.481 // from ebay.com/gds/Movie-Poster-Size-Guide-/10000000005754120/g.html

	// TODO: find the largest size beneath `ideal`
	const poster = sizes.find(p => p.width === ideal)

	// TODO: provide a fallback image
	const uri = poster ? poster.url : ''

	return (
		<glamorous.Image
			accessibilityLabel="Movie Poster"
			borderRadius={8}
			// defaultSource
			height={width * ratio}
			overflow="hidden"
			resizeMode="cover"
			source={{uri}}
			width={width}
		/>
	)
}

export const Poster = (props: PosterProps & {left: number}) => {
	// TODO: find way to avoid backgroundColor:transparent on wrapper

	return (
		<glamorous.View
			backgroundColor={c.transparent}
			marginTop={16}
			shadowColor={setLightness(0.35, setSaturation(0.25, props.tint))}
			shadowOffset={{height: 4, width: 0}}
			shadowOpacity={0.8}
			shadowRadius={12}
		>
			<ShrinkWhenTouched onPress={props.onPress}>
				<PosterImage {...props} />
			</ShrinkWhenTouched>
		</glamorous.View>
	)
}
