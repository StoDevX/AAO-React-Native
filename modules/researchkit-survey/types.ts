export type QuestionType =
	| 'boolean'
	| 'singleChoice'
	| 'multipleChoice'
	| 'scale'
	| 'text'
	| 'numeric'
	| 'date'
	| 'time'
	| 'email'
	| 'continuousScale'
	| 'textChoiceOther'
	| 'valuePicker'
	| 'imageChoice'
	| 'location'
	| 'timeInterval'
	| 'formStep'

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

export interface NumericQuestion extends BaseQuestion {
	type: 'numeric'
	style?: 'integer' | 'decimal'
	min?: number
	max?: number
	unit?: string
	placeholder?: string
}

export interface DateQuestion extends BaseQuestion {
	type: 'date'
	style?: 'date' | 'dateTime'
	minDate?: string
	maxDate?: string
	defaultDate?: string
}

export interface TimeQuestion extends BaseQuestion {
	type: 'time'
	defaultTime?: string
}

export interface EmailQuestion extends BaseQuestion {
	type: 'email'
	placeholder?: string
}

export interface ContinuousScaleQuestion extends BaseQuestion {
	type: 'continuousScale'
	min: number
	max: number
	minLabel?: string
	maxLabel?: string
	defaultValue?: number
	fractionDigits?: number
}

export interface TextChoiceOtherQuestion extends BaseQuestion {
	type: 'textChoiceOther'
	style?: 'singleChoice' | 'multipleChoice'
	choices: Array<{value: string; text: string}>
	otherPlaceholder?: string
}

export interface ValuePickerQuestion extends BaseQuestion {
	type: 'valuePicker'
	choices: Array<{value: string; text: string}>
}

export interface ImageChoiceQuestion extends BaseQuestion {
	type: 'imageChoice'
	style?: 'singleChoice' | 'multipleChoice'
	choices: Array<{
		value: string
		text: string
		image: {sfSymbol: string} | {url: string}
	}>
}

export interface LocationQuestion extends BaseQuestion {
	type: 'location'
	placeholder?: string
}

export interface TimeIntervalQuestion extends BaseQuestion {
	type: 'timeInterval'
	defaultInterval?: number
	step?: number
}

export type FormItem =
	| BooleanQuestion
	| ChoiceQuestion
	| ScaleQuestion
	| TextQuestion
	| NumericQuestion
	| DateQuestion
	| TimeQuestion
	| EmailQuestion
	| ContinuousScaleQuestion
	| TextChoiceOtherQuestion
	| ValuePickerQuestion
	| ImageChoiceQuestion
	| LocationQuestion
	| TimeIntervalQuestion

export interface FormStepSection {
	title?: string
	items: FormItem[]
}

export interface FormStep {
	type: 'formStep'
	id: string
	title: string
	text?: string
	cardView?: boolean
	sections: FormStepSection[]
}

export type Question = FormItem | FormStep

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
