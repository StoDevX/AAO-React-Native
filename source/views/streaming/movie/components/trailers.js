// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
import openUrl from '../../../components/open-url'
import glamorous from 'glamorous-native'
import type {MovieTrailer} from '../types'
import {SectionHeading, Card, ShrinkWhenTouched} from './parts'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'

type Viewport = {width: number, height: number}

export const Trailers = (props: {
	trailers: Array<MovieTrailer>,
	viewport: Viewport,
}) => {
	const {viewport, trailers: allTrailers} = props

	const trailers = allTrailers.filter(t => t.type === 'Trailer')
	const teasers = allTrailers.filter(t => t.type === 'Teaser')
	const featurettes = allTrailers.filter(t => t.type === 'Featurette')
	const clips = allTrailers.filter(t => t.type === 'Clip')

	return (
		<React.Fragment>
			<Clips clips={trailers} title="TRAILERS" viewport={viewport} />
			<Clips clips={teasers} title="TEASERS" viewport={viewport} />
			<Clips clips={featurettes} title="FEATURETTES" viewport={viewport} />
			<Clips clips={clips} title="CLIPS" viewport={viewport} />
		</React.Fragment>
	)
}

const Clips = (props: {
	viewport: Viewport,
	title: string,
	clips: Array<MovieTrailer>,
}) => {
	const {clips, title, viewport} = props

	if (!clips.length) {
		return null
	}

	return (
		<React.Fragment>
			<SectionHeading>{title}</SectionHeading>
			<glamorous.ScrollView
				contentContainerStyle={styles.container}
				horizontal={true}
				overflow="visible"
			>
				{clips.map(t => <ClipTile key={t.url} clip={t} viewport={viewport} />)}
			</glamorous.ScrollView>
		</React.Fragment>
	)
}

const SpacedCard = ({viewport, children}) => {
	const width = Math.min(300, viewport.width - 75)
	return (
		<Card
			height={width / 3 * 2}
			justifyContent="flex-end"
			marginHorizontal={10}
			marginVertical={16}
			width={width}
		>
			{children}
		</Card>
	)
}

const Padding = glamorous.view({
	paddingBottom: 8,
	paddingHorizontal: 10,
	paddingTop: 10,
})

const ClipTitle = glamorous.text({
	color: c.white,
	fontSize: 18,
	fontWeight: '700',
})

const ClipTile = (props: {clip: MovieTrailer, viewport: Viewport}) => {
	const {clip, viewport} = props

	// TODO: pick appropriate thumbnail
	const thumbnailUrl = clip.thumbnails[0].url

	return (
        <ShrinkWhenTouched onPress={() => openUrl(clip.url)}>
		<SpacedCard viewport={viewport}>
			<glamorous.Image
				source={{uri: thumbnailUrl}}
				style={[StyleSheet.absoluteFill, styles.cardBorderRadius]}
			/>

			<LinearGradient
				colors={[c.transparent, c.transparent, c.black]}
				locations={[0, 0.6, 1]}
				style={[StyleSheet.absoluteFill, styles.cardBorderRadius]}
			/>

			<Padding>
				<ClipTitle>
					{clip.name}
					{'  '}
					<Icon name="ios-play" size={18} />
				</ClipTitle>
			</Padding>
		</SpacedCard>
        </ShrinkWhenTouched>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 6,
	},
	cardBorderRadius: {
		borderRadius: 8,
	},
})
