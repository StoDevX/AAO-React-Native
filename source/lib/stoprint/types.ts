export type PrintJob = {
	copies: number
	documentName: string
	deniedReasonFormatted?: string
	grayscaleFormatted: 'Yes' | 'No'
	id: string | number // maybe just "any"...
	paperSizeFormatted: string
	printerName: string
	serverName: string
	status: string | 'DENIED'
	statusDetail: string
	statusFormatted: string
	totalPages: number
	usageCostFormatted: string
	usageTimeFormatted: string
}

export type HeldJob = {
	canRelease: boolean
	client: string
	isDenied: boolean
	copies: number
	documentName: string
	deniedReasonFormatted?: string
	grayscaleFormatted: 'Yes' | 'No'
	id: string
	paperSizeFormatted: string
	printerName: string
	serverName: string
	usageCostFormatted: string
	usageTimeFormatted: string
}

export type PrintJobsResponse = {
	jobs: Array<PrintJob>
}

export type PrintJobsResponseOrErrorType =
	| {error: true; value: string}
	| {error: false; value: PrintJobsResponse}

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/webclient/users/rives/jobs/status
export type StatusResponse = {
	hashCode: number
	jobs: Array<PrintJob>
}

export type Printer = {
	location?: string
	serverName: string
	code: string
	printerName: string
}

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/recent-popular-printers
// ?username=rives
export type RecentPopularPrintersResponse = {
	popularPrinters: Array<Printer>
	recentPrinters: Array<Printer>
}

export type RecentPopularPrintersResponseOrErrorType =
	| {error: true; value: string}
	| {error: false; value: RecentPopularPrintersResponse}

export type ColorPrintersReponse = {
	data: {colorPrinters: Array<string>}
}

export type ColorPrintersResponseOrErrorType =
	| {error: true; value: string}
	| {error: false; value: ColorPrintersReponse}

export type ReleaseResponse = {
	numJobsReleased: number
	statusMessage: string
}

export type ReleaseResponseOrErrorType =
	| {error: true; value: Error}
	| {error: false; value: ReleaseResponse}

export type CancelResponseOrErrorType =
	| {error: true; value: Error}
	| {error: false; value: Response}

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/all-printers
// ?username=rives
export type AllPrintersResponse = Array<Printer>

export type AllPrintersResponseOrErrorType =
	| {error: true; value: string}
	| {error: false; value: AllPrintersResponse}

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/held-jobs/
// ?username=rives
// &printerName=printers\mfc-it
export type HeldJobsResponse = Array<HeldJob>
export type HeldJobsResponseOrErrorType =
	| {error: true; value: Error}
	| {error: false; value: HeldJobsResponse}

export type LoginResponse = {
	authCookie: string
	isMobileReleaseEnabled: boolean
	realName: string
	rememberMeEnabled: boolean
	success: true
}

export type LoginResponseOrErrorType =
	| {error: true; value: Error}
	| {error: false; value: LoginResponse}
