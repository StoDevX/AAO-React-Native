// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {Row, Column} from '../../../components/layout'
import type {MovieTrailer} from '../types'
import {SectionHeading, Card} from './parts'
import LinearGradient from 'react-native-linear-gradient'

type Props = {
	trailers: Array<MovieTrailer>,
}

export const Trailers = ({trailers: allTrailers}: Props) => {
	if (!allTrailers.length) {
		return null
	}

	const trailers = allTrailers.filter(t => t.type === 'Trailer')
	const teasers = allTrailers.filter(t => t.type === 'Teaser')
	const featurettes = allTrailers.filter(t => t.type === 'Featurette')
	const clips = allTrailers.filter(t => t.type === 'Clip')

	return (
		<React.Fragment>
			<ClipSelection clips={trailers} title="TRAILERS" />
			<ClipSelection clips={teasers} title="TEASERS" />
			<ClipSelection clips={featurettes} title="FEATURETTES" />
			<ClipSelection clips={clips} title="CLIPS" />
		</React.Fragment>
	)
}

const ClipSelection = (props: {title: string, clips: Array<MovieTrailer>}) => {
	const {clips, title} = props

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
				{clips.map(t => <ClipTile key={t.url} clip={t} />)}
			</glamorous.ScrollView>
		</React.Fragment>
	)
}

const SpacedCard = ({children, ...props}) => (
	<Card
		justifyContent="flex-end"
		height={200}
		marginHorizontal={10}
		marginVertical={16}
		width={300}
	>
		{children}
	</Card>
)

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

const ClipTile = ({clip}: {clip: MovieTrailer}) => {
	// TODO: pick appropriate thumbnail
	const thumbnailUrl = clip.thumbnails[0].url

	return (
		<SpacedCard>
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
				<ClipTitle>{clip.name}</ClipTitle>
			</Padding>
		</SpacedCard>
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
