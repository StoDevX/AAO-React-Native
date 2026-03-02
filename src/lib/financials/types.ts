export type BalancesShapeType = {
	flex: string | undefined
	ole: string | undefined
	print: string | undefined
	weekly: string | undefined
	daily: string | undefined
	plan: string | undefined
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
