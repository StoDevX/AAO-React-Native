export type QuestionType = 'boolean' | 'singleChoice' | 'multipleChoice' | 'scale' | 'text'

interface BaseQuestion {
	id: string
	title: string
	text?: string
	optional?: boolean
}

export interface BooleanQuestion extends BaseQuestion {
	type: 'boolean'
	yesText?: string
	noText?: string
}

export interface ChoiceQuestion extends BaseQuestion {
	type: 'singleChoice' | 'multipleChoice'
	choices: Array<{value: string; text: string}>
}

export interface ScaleQuestion extends BaseQuestion {
	type: 'scale'
	min: number
	max: number
	minLabel?: string
	maxLabel?: string
	defaultValue?: number
}

export interface TextQuestion extends BaseQuestion {
	type: 'text'
	multiline?: boolean
	maxLength?: number
	placeholder?: string
}

export type Question = BooleanQuestion | ChoiceQuestion | ScaleQuestion | TextQuestion

export interface SurveyDefinition {
	id: string
	title: string
	instructions?: string
	questions: Question[]
}

export interface SurveyResult {
	completed: boolean
	answers: Record<string, unknown>
}
