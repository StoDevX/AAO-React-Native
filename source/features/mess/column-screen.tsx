import * as React from 'react'
import {Stack} from 'expo-router'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {refetchFromFirstPage} from '../../lib/infinite-data'
import {messKeys} from './lib/keys'
import {MessPage, PAPER_BAR, PaperTitle} from './mess-page'
import {messCategoriesOptions} from './query'
import {CategoryStories} from './story-list'

/** One column's newest stories, on a page of its own titled with the column's name. */
export function ColumnScreen({id}: {id: number}): React.ReactNode {
	let queryClient = useQueryClient()
	let categories = useQuery(messCategoriesOptions)
	let name = categories.data?.find((category) => category.id === id)?.name ?? ''
	return (
		<>
			<Stack.Screen options={PAPER_BAR} />
			<PaperTitle title={name} />
			<MessPage onRefresh={() => refetchFromFirstPage(queryClient, messKeys.category(id))}>
				<CategoryStories categoryId={id} />
			</MessPage>
		</>
	)
}
