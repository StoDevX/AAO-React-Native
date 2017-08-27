// @flow

export type ViewCollectionType = {
  [key: string]: {
    [key: string]: {
      view: ReactClass<*>,
      delay: number,
    },
  },
}
