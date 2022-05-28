export type BalancesShapeType = {
	flex: string | null
	ole: string | null
	print: string | null
	weekly: string | null
	daily: string | null
	plan: string | null
}

export type MealPlanInfoType = {
	plan?: string
	leftDaily?: string
	leftWeekly?: string
}

export type AccountBalanceType = {
	account: string
	numeric: number
	formatted: string
}

export type OleCardBalancesType = {
	data: {
		accounts: Array<AccountBalanceType>
		meals?: MealPlanInfoType
	}
	error?: string
}
