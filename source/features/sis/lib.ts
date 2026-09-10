/**
 * What a balance tile shows: the figure, or why there isn't one.
 *
 * Loading and absent are different answers -- an ellipsis says "not yet",
 * where N/A says "the server had nothing".
 */
export function balanceValue(value: string | undefined, isLoading: boolean): string {
	if (isLoading) {
		return '…'
	}
	return value ?? 'N/A'
}
