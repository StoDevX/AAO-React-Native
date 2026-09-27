import {z} from 'zod'
import type {PayStructure, PayTier} from './posting'

/// Dollars an hour, by pay structure and tier, as data/student-wages.yaml
/// writes them.
export type HourlyWages = Record<PayStructure, Record<PayTier, number>>

const TiersSchema = z.object({
	1: z.number().positive(),
	2: z.number().positive(),
	3: z.number().positive(),
})

/// The published file, checked before it is used: a missing tier would show
/// "$NaN/hr" on every posting with that code, while a rejected fetch leaves
/// the wages the query already has.
export const PublishedWagesSchema = z.object({
	data: z.object({ST: TiersSchema, NST: TiersSchema, OSA: TiersSchema}),
})
