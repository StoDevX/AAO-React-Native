// @flow
import {fetch} from '@frogpond/fetch'
import {type Movie as WeeklyMovie} from '../views/streaming/movie/types'
import {WEEKLY_MOVIE_URL} from '../lib/constants'

type MaybeError<T> = {error: true, message: string} | {error: false, data: T}

async function fetchWeeklyMovieRemote(): Promise<MaybeError<WeeklyMovie>> {
	try {
		const nextMovie = await fetch(`${WEEKLY_MOVIE_URL}/next.json`).json()
		const movieInfo = await fetch(nextMovie.movie).json()
		return {error: false, data: movieInfo}
	} catch (err) {
		return {error: true, message: err.message}
	}
}

export async function fetchWeeklyMovie(
	isOnline: boolean,
): Promise<MaybeError<WeeklyMovie>> {
	if (!isOnline) {
		return {error: true, message: 'You are currently offline'}
	}

	const request = await fetchWeeklyMovieRemote()
	if (request.error) {
		return {error: true, message: request.message}
	}

	return {error: false, data: request.data}
}
