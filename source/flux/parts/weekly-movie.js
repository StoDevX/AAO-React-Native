// @flow

import {type ReduxState} from '../index'
import {type Movie as WeeklyMovie} from '../../views/streaming/movie/types'
import {fetchWeeklyMovie} from '../../lib/cache'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = GetWeeklyMovieAction

const WEEKLY_MOVIE_START = 'streaming/WEEKLY_MOVIE/start'
const WEEKLY_MOVIE_FAILURE = 'streaming/WEEKLY_MOVIE/failure'
const WEEKLY_MOVIE_SUCCESS = 'streaming/WEEKLY_MOVIE/success'

type GetWeeklyMovieStartAction = {type: 'streaming/WEEKLY_MOVIE/start'}
type GetWeeklyMovieFailureAction = {
	type: 'streaming/WEEKLY_MOVIE/failure',
	payload: string,
}
type GetWeeklyMovieSuccessAction = {
	type: 'streaming/WEEKLY_MOVIE/success',
	payload: WeeklyMovie,
}
type GetWeeklyMovieAction =
	| GetWeeklyMovieStartAction
	| GetWeeklyMovieFailureAction
	| GetWeeklyMovieSuccessAction

export function getWeeklyMovie(): ThunkAction<GetWeeklyMovieAction> {
	return async (dispatch, getState) => {
		dispatch({type: WEEKLY_MOVIE_START})

		const state = getState()
		const isOnline = Boolean(state.app && state.app.isConnected)

		try {
			const movie = await fetchWeeklyMovie(isOnline)
			if (movie.error) {
				return dispatch({type: WEEKLY_MOVIE_FAILURE, payload: movie.message})
			}
			dispatch({type: WEEKLY_MOVIE_SUCCESS, payload: movie.data})
		} catch (err) {
			dispatch({type: WEEKLY_MOVIE_FAILURE, payload: err.message})
		}
	}
}

export type State = {|
	+fetching: boolean,
	+movie: ?WeeklyMovie,
	+lastFetchError: ?boolean,
|}

const initialState = {
	fetching: false,
	movie: null,
	lastFetchError: null,
}

export function weeklyMovie(state: State = initialState, action: Action) {
	switch (action.type) {
		case WEEKLY_MOVIE_START:
			return {...state, fetching: true}

		case WEEKLY_MOVIE_FAILURE:
			return {
				...state,
				fetching: false,
				lastFetchError: true,
				lastFetchErrorMessage: action.payload,
			}

		case WEEKLY_MOVIE_SUCCESS:
			return {
				...state,
				fetching: false,
				lastFetchError: false,
				movie: action.payload,
			}

		default:
			return state
	}
}
