// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {Row, Column} from '../../../components/layout'
import type {MovieTrailer} from '../types'
import {SectionHeading, Card} from './parts'

type Props = {
	trailers: Array<MovieTrailer>,
}

export const Trailers = ({trailers: allTrailers}: Props) => {
	if (!allTrailers.length) {
		return null
	}

	const trailers = allTrailers.filter(t => t.type === 'Trailer')
	const teasers = trailers.filter(t => t.type === 'Teaser')
	const featurettes = trailers.filter(t => t.type === 'Featurette')
	const clips = trailers.filter(t => t.type === 'Clip')

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
			<glamorous.ScrollView horizontal={true} overflow="visible">
				{clips.map(t => <ClipTile key={t.url} clip={t} />)}
			</glamorous.ScrollView>
		</React.Fragment>
	)
}

const PaddedCard = ({children}) => (
	<Card
		marginHorizontal={10}
		marginVertical={16}
		paddingBottom={8}
		paddingHorizontal={10}
		paddingTop={10}
	>
		{children}
	</Card>
)

const BigText = glamorous.text({
	color: c.black,
	fontSize: 22,
	lineHeight: 22,
	fontWeight: '900',
})

const DimText = glamorous.text({
	color: c.iosDisabledText,
	fontSize: 14,
	lineHeight: 22,
})

const SmallText = glamorous.text({
	color: c.black,
	fontSize: 13,
	fontVariant: ['small-caps'],
})

const ClipTile = ({clip}: {clip: MovieTrailer}) => {
	return (
		<PaddedCard>
			<glamorous.Text>Trailer</glamorous.Text>
		</PaddedCard>
	)
}
