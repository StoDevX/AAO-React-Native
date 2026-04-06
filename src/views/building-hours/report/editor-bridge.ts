import type {SingleBuildingScheduleType} from '../types'

type EditCallback = (
	scheduleIdx: number,
	setIdx: number,
	set: SingleBuildingScheduleType,
) => void
type DeleteCallback = (scheduleIdx: number, setIdx: number) => void

let editCallback: EditCallback | null = null
let deleteCallback: DeleteCallback | null = null

export function setEditorCallbacks(
	onEdit: EditCallback,
	onDelete: DeleteCallback,
): void {
	editCallback = onEdit
	deleteCallback = onDelete
}

export function callEditCallback(
	scheduleIdx: number,
	setIdx: number,
	set: SingleBuildingScheduleType,
): void {
	editCallback?.(scheduleIdx, setIdx, set)
}

export function callDeleteCallback(scheduleIdx: number, setIdx: number): void {
	deleteCallback?.(scheduleIdx, setIdx)
}
