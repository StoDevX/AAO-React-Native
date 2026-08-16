import {z} from 'zod'
import type {JobSummary} from '../types'

const RequisitionSchema = z.object({
	Id: z.string(),
	Title: z.string(),
	PostedDate: z.string(),
	PrimaryLocation: z.string().nullish(),
})

const CategorySchema = z.object({
	Id: z.number(),
	Name: z.string(),
	TotalCount: z.number(),
})

const SearchSchema = z.object({
	requisitionList: z.array(RequisitionSchema).optional(),
	categoriesFacet: z.array(CategorySchema).optional(),
})

/// Every Candidate Experience search response is a collection of exactly one
/// search result, whatever was asked for.
const ResponseSchema = z.object({
	items: z.array(SearchSchema).min(1),
})

export function parseCategories(body: unknown): Array<{id: number; name: string; count: number}> {
	let {items} = ResponseSchema.parse(body)
	let facet = items[0]?.categoriesFacet ?? []

	return facet.map((category) => ({
		id: category.Id,
		name: category.Name,
		count: category.TotalCount,
	}))
}

export function parseRequisitions(body: unknown): JobSummary[] {
	let {items} = ResponseSchema.parse(body)
	let list = items[0]?.requisitionList ?? []

	return list.map((job) => ({
		id: job.Id,
		title: job.Title,
		postedDate: job.PostedDate,
		location: job.PrimaryLocation ?? undefined,
	}))
}
