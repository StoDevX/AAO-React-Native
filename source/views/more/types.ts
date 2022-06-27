export interface SearchData {
	az_nav: {
		menu_items: LinkResults[]
	}
}

export interface LinkResults {
	letter: string
	values: LinkValue[]
}

export interface LinkGroup {
	title: string
	data: LinkValue[]
}

export interface LinkValue {
	label: string
	url: string
}
