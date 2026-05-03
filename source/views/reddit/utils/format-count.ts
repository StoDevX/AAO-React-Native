export const formatCommentCount = (n: number): string => {
	switch (n) {
		case 0:
			return 'Comments'
		case 1:
			return '1 comment'
		default:
			return `${n} comments`
	}
}
