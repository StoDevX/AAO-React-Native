// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import glamorous from 'glamorous-native'
import maxBy from 'lodash/maxBy'
import type {MovieTrailer} from '../../types'
import {ShrinkWhenTouched} from '../parts'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import {Card} from 'react-native-paper'

type Viewport = {width: number, height: number}

export const AndroidTrailers = (props: {
	trailers: Array<MovieTrailer>,
	viewport: Viewport,
}) => {
	const {viewport, trailers: allTrailers} = props

	const trailers = allTrailers.filter(t => t.type === 'Trailer')
	const teasers = allTrailers.filter(t => t.type === 'Teaser')
	const featurettes = allTrailers.filter(t => t.type === 'Featurette')
	const clips = allTrailers.filter(t => t.type === 'Clip')

	return (
		<>
			<Clips clips={trailers} title="TRAILERS" viewport={viewport} />
			<Clips clips={teasers} title="TEASERS" viewport={viewport} />
			<Clips clips={featurettes} title="FEATURETTES" viewport={viewport} />
			<Clips clips={clips} title="CLIPS" viewport={viewport} />
		</>
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
		<>
			<Card.Title title={title} />
			<glamorous.ScrollView
				contentContainerStyle={styles.container}
				horizontal={true}
				overflow="visible"
			>
				{clips.map(t => (
					<ShrinkWhenTouched key={t.url} onPress={() => openUrl(t.url)}>
						<ClipTile clip={t} viewport={viewport} />
					</ShrinkWhenTouched>
				))}
			</glamorous.ScrollView>
		</>
	)
}

const AndroidSpacedCard = ({children}) => {
	return <Card style={styles.card}>{children}</Card>
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
	const thumbnailUrl = maxBy(clip.thumbnails, t => t.width).url
	const width = Math.min(300, viewport.width - 75)

	return (
		<AndroidSpacedCard viewport={viewport}>
			<Card.Content
				style={[styles.content, {width: width, height: (width / 3) * 2}]}
			>
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
			</Card.Content>
		</AndroidSpacedCard>
	)
}

const styles = StyleSheet.create({
	card: {
		elevation: 2,
		marginBottom: 10,
		marginHorizontal: 10,
	},
	content: {
		marginVertical: 12,
		marginHorizontal: 10,
		justifyContent: 'flex-end',
	},
	container: {
		paddingHorizontal: 6,
	},
	cardBorderRadius: {
		borderRadius: 8,
	},
})
