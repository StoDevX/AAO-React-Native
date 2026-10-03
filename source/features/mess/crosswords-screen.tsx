import * as React from 'react'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {ColumnScreen} from './column-screen'
import {MessPage} from './mess-page'
import {PageLoading, PageMessage, PageNotice} from './page-notice'
import {messCategoriesOptions} from './query'
import {CROSSWORD_COLUMN, crosswordColumnId} from './lib/puzzle'

/**
 * The paper's crosswords, newest first, as the Crossword column's own page. The column is found
 * by name, so the home tile keeps working if the paper's WordPress renumbers it.
 */
export function CrosswordsScreen(): React.ReactNode {
	let categories = useQuery(messCategoriesOptions)
	let id = categories.data ? crosswordColumnId(categories.data) : undefined

	if (id !== undefined) {
		return <ColumnScreen id={id} />
	}

	return (
		<>
			<Stack.Screen options={{title: CROSSWORD_COLUMN}} />
			<MessPage onRefresh={() => categories.refetch()}>
				{categories.isError ? (
					<PageNotice error={categories.error} onRetry={() => categories.refetch()} />
				) : categories.data ? (
					<PageMessage text="The Messenger has no crosswords right now." />
				) : (
					<PageLoading paused={categories.fetchStatus === 'paused'} />
				)}
			</MessPage>
		</>
	)
}
