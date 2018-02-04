// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import glamorous from 'glamorous-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {MovieRating} from '../types'

type RatingsProps = {
	ratings: Array<MovieRating>,
}

const FullStar = () => (
	<Icon name={Platform.OS === 'ios' ? 'ios-star' : 'md-star'} size={22} />
)
const HalfStar = () => (
	<Icon
		name={Platform.OS === 'ios' ? 'ios-star-half' : 'md-star-half'}
		size={22}
	/>
)
const EmptyStar = () => (
	<Icon
		name={Platform.OS === 'ios' ? 'ios-star-outline' : 'md-star-outline'}
		size={22}
	/>
)

export const ImdbRating = ({ratings}: RatingsProps) => {
	const rating = ratings.find(r => r.Source === 'Internet Movie Database')

	if (!rating) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const score = normalizeScore(rating.Value)
	if (!score) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const tint = colorizeScore(rating.Value)

	return (
		<glamorous.Text color={tint}>
			<glamorous.Text fontSize={24} fontWeight="800">
				{score / 10}
			</glamorous.Text>
			{' ⁄ '}
			<glamorous.Text fontVariant={['small-caps']}>10</glamorous.Text>
		</glamorous.Text>
	)
}

export const RottenTomatoesRating = ({ratings}: RatingsProps) => {
	const rating = ratings.find(r => r.Source === 'Rotten Tomatoes')

	if (!rating) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const score = normalizeScore(rating.Value)
	if (!score) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const stars = Math.round(score / 20)
	const starIcons = []
	for (let i = 0; i < 5; i++) {
		if (i < stars) {
			starIcons.push(<FullStar key={i} />)
		} else if (i === stars && i % 2 === 1) {
			starIcons.push(<HalfStar key={i} />)
		} else {
			starIcons.push(<EmptyStar key={i} />)
		}
	}

	const tint = colorizeScore(rating.Value)
	return <glamorous.Text color={tint}>{starIcons}</glamorous.Text>
}

export const MpaaRating = ({rated}: {rated: string}) => (
	<glamorous.View borderWidth={1} paddingHorizontal={4} paddingVertical={1}>
		<glamorous.Text fontFamily="Palatino" fontWeight="700" textAlign="center">
			{rated}
		</glamorous.Text>
	</glamorous.View>
)

function normalizeScore(score: string): ?number {
	if (score.endsWith('%')) {
		// XX%
		score = score.replace('%', '')
		return parseInt(score)
	} else if (score.includes('/')) {
		// X/10
		score = score.split('/')[0]
		return Math.round(parseFloat(score) * 10)
	}

	return null
}

function colorizeScore(score: string) {
	let numScore = normalizeScore(score)

	if (!numScore) {
		return 'black'
	}

	const MAX_VALUE = 200
	const normalizedScore = Math.round(numScore / 100 * MAX_VALUE)

	return `rgb(${MAX_VALUE - normalizedScore}, ${normalizedScore}, 0)`
}
