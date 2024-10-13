export interface BalancesShapeType {
	flex: string | undefined
	ole: string | undefined
	print: string | undefined
	weekly: string | undefined
	daily: string | undefined
	plan: string | undefined
}

export interface MealPlanInfoType {
	plan?: string
	leftDaily?: string
	leftWeekly?: string
}

export interface AccountBalanceType {
	account: string
	numeric: number
	formatted: string
}

export interface OleCardBalancesType {
	data: {
		accounts: AccountBalanceType[]
		meals?: MealPlanInfoType
	}
	error?: string
}
