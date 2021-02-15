export default function buildFormData(obj: {[key: string]: string}): FormData {
	const formData = new FormData()

	Object.keys(obj).forEach((key: string) => {
		formData.append(key, obj[key])
	})

	return formData
}
