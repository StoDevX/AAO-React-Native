export default function buildFormData(obj) {
  let formData = new FormData()
  for (let [key, val] of Object.entries(obj)) {
    formData.append(key, val)
  }
  return formData
}
