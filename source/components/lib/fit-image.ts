type Size = {width: number; height: number}

/**
 * The size to draw a whole picture at in a row: as wide as the row, unless that
 * would make it taller than `maxHeight`, in which case as tall as the cap and
 * narrower by as much. The picture is never cropped, so a very tall one cannot
 * push the rest of the screen out of reach.
 *
 * Zero until the row has a width and the picture reports a size.
 */
export function fitImage({
	rowWidth,
	imageWidth,
	imageHeight,
	maxHeight,
}: {
	rowWidth: number
	imageWidth: number
	imageHeight: number
	maxHeight: number
}): Size {
	if (rowWidth <= 0 || imageWidth <= 0 || imageHeight <= 0) {
		return {width: 0, height: 0}
	}

	let scale = Math.min(rowWidth / imageWidth, maxHeight / imageHeight)
	return {width: imageWidth * scale, height: imageHeight * scale}
}
