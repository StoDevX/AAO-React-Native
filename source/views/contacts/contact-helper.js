// @flow

export function formatNumber(phoneNumber: string) {
  const re = /(\d{3})-?(\d{3})-?(\d{4})/g
  return phoneNumber.replace(re, '($1) $2-$3')
}
