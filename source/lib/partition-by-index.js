// @flow

export function partitionByIndex<T>(arr: T[]): [T[], T[]] {
  return arr.reduce(
    (acc, val, idx) => {
      return idx % 2 === 0
        ? [acc[0].concat(val), acc[1]]
        : [acc[0], acc[1].concat(val)]
    },
    [[], []],
  )
}
