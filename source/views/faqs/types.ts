import type {
	RootViewsParamList,
	SettingsStackParamList,
} from '../../navigation/types'

export type FaqTarget = keyof (RootViewsParamList & SettingsStackParamList)

/** Canonical list of screens that FAQ banners can target. Keep in sync with FaqTarget. */
export const FAQ_TARGET_SCREENS: FaqTarget[] = [
	'Home',
	'SIS',
	'SettingsRoot',
	'Faq',
	'BuildingHours',
	'Contacts',
	'CourseSearch',
	'Dictionary',
	'Directory',
	'PrintJobs',
	'StudentOrgs',
	'More',
] satisfies FaqTarget[]

export type FaqSeverity = 'notice' | 'info' | 'alert'

export type PlatformCondition = 'ios' | 'android' | 'native'

export type ConditionRule = {
	platforms?: PlatformCondition[]
	versionRange?: string
	startDate?: number
	endDate?: number
}

export type ConditionNode =
	| {type: 'rule'; rule: ConditionRule}
	| {type: 'and'; children: ConditionNode[]}
	| {type: 'or'; children: ConditionNode[]}
	| {type: 'not'; child: ConditionNode}

export type RepeatRule = {
	intervalMs: number
	description?: string
}

export type Faq = {
	id: string
	question: string
	answer: string
	targets: FaqTarget[]
	bannerTitle: string
	bannerText: string
	bannerCta?: string
	severity: FaqSeverity
	icon?: string
	backgroundColor?: string
	foregroundColor?: string
	dismissable: boolean
	repeatRule?: RepeatRule
	conditions?: ConditionNode[]
	updatedAt?: string
}

export type FaqQueryData = {
	faqs: Faq[]
	legacyText?: string
}
