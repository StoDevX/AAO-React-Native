// @flow

import * as React from 'react'
import {StyleSheet, Platform, ScrollView} from 'react-native'
import moment from 'moment-timezone'
import glamorous from 'glamorous-native'
import {rgb} from 'polished'

import {TabBarIcon} from '@frogpond/navigation-tabs'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Row} from '@frogpond/layout'
import {openUrl} from '@frogpond/open-url'
import {ListSeparator} from '@frogpond/lists'
import {useViewport} from '@frogpond/viewport'
import {fetch} from '@frogpond/fetch'
import {WEEKLY_MOVIE_URL} from '../../../lib/constants'

import {
	MovieInfo,
	Title,
	Spacer,
	FixedSpacer,
	FooterAction,
} from './components/parts'
import {Pill} from './components/pill'
import {Poster} from './components/poster'
import {TrailerBackground} from './components/trailer-background'
import {Genres} from './components/genres'
import {
	RottenTomatoesRating,
	ImdbRating,
	MpaaRating,
} from './components/ratings.js'
import {Showings} from './components/showings'
import {Plot} from './components/plot'
import {Credits} from './components/credits'
import {Trailers} from './components/trailers'
import type {Movie, RGBTuple, MovieTrailerThumbnail} from './types'
import {useAsync} from 'react-async'

async function fetchWeeklyMovie(_, {signal}): Promise<Movie> {
	let url = `${WEEKLY_MOVIE_URL}/next.json`
	const nextMovie = await fetch(url, {signal}).json()
	return fetch(nextMovie.movie, {signal}).json()
}

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

function findLargestTrailerImage(movie: Movie): ?MovieTrailerThumbnail {
	if (!movie.trailers && movie.trailers.size) {
		return null
	}

	return movie.trailers
		.map(trailer => trailer.thumbnails.find(thm => thm.width === 640))
		.find(trailer => trailer)
}

export function WeeklyMovieView() {
	const viewport = useViewport()

	let {data: movie, error, isLoading, reload} = useAsync({
		promiseFn: fetchWeeklyMovie,
	})

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text={`There was a problem loading the movie: ${error.message}`}
			/>
		)
	}

	if (!movie) {
		return <NoticeView text="this should never happen" />
	}

	// TODO: handle odd-shaped posters
	// TODO: style for Android
	// TODO: handle "no movie posted yet this week"
	// TODO: handle "no movie will show this week"
	// TODO: handle all movie showing dates are past
	// TODO: also handle after-last-showing on last showing date
	// TODO: remove the Play button
	// TODO: handle multiple movies on one weekend

	const largestTrailerImage = findLargestTrailerImage(movie)
	const movieTint = makeRgb(movie.poster.colors.dominant)
	const landscape = viewport.width > viewport.height
	const headerHeight = landscape
		? Math.max(viewport.height * (2 / 3), 200)
		: Math.max(viewport.height / 3, 200)
	const imdbUrl = `https://www.imdb.com/title/${movie.info.imdbID}`

	return (
		<ScrollView contentContainerStyle={styles.contentContainer}>
			<TrailerBackground
				background={largestTrailerImage}
				height={headerHeight}
				movie={movie}
				tint={movieTint}
			/>

			<Row
				alignItems="flex-end"
				justifyContent="space-between"
				minHeight={headerHeight}
				paddingHorizontal={10}
			>
				<Poster
					ideal={512}
					left={0}
					onPress={() => openUrl(imdbUrl)}
					sizes={movie.poster.sizes}
					tint={movieTint}
				/>
			</Row>

			<MovieInfo movie={movie}>
				<Title selectable={true}>{movie.info.Title}</Title>

				<Row alignItems="center" marginBottom={4} marginTop={4}>
					<Pill bgColor={c.candyBlue} marginRight={4}>
						{moment(movie.info.ReleaseDate).format('YYYY')}
					</Pill>
					<Pill bgColor={c.candyLime}>{movie.info.Runtime}</Pill>
				</Row>

				<Row alignItems="flex-end" marginBottom={4} marginTop={4}>
					<Genres genres={movie.info.Genres} />
				</Row>

				<Row alignItems="center">
					<RottenTomatoesRating ratings={movie.info.Ratings} />
					<FixedSpacer />
					<ImdbRating ratings={movie.info.Ratings} />
					<Spacer />
					<MpaaRating rated={movie.info.Rated} />
				</Row>
			</MovieInfo>

			<Showings showings={movie.showings} />

			<ListSeparator />

			<Plot text={movie.info.Plot} />

			<Credits
				actors={movie.info.Actors}
				directors={movie.info.Director}
				writers={movie.info.Writer}
			/>

			<Trailers trailers={movie.trailers} viewport={viewport} />

			<FooterAction onPress={() => openUrl(imdbUrl)} text="Open IMDB Page" />

			<glamorous.View height={16} />
		</ScrollView>
	)
}

WeeklyMovieView.navigationOptions = {
	tabBarLabel: 'Movie',
	tabBarIcon: TabBarIcon('film'),
}

const styles = StyleSheet.create({
	contentContainer: {
		...Platform.select({
			ios: {
				backgroundColor: c.white,
			},
		}),
	},
})
