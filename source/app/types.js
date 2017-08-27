// @flow

type HomescreenView = {
  type: 'view',
  view: string,
  title: string,
  icon: string,
  tint: string,
  gradient?: [string, string],
}

type HomescreenLink = {
  type: 'url',
  view: string,
  url: string,
  title: string,
  icon: string,
  tint: string,
  gradient?: [string, string],
}

type HomescreenNotReally = {
  type: 'hidden',
}

export type VisibleHomescreenViewType = HomescreenView | HomescreenLink

export type HomescreenViewType =
  | HomescreenView
  | HomescreenLink
  | HomescreenNotReally

export type AppNavigationType = {
  [key: string]: {
    screen: any, // TODO: change to React.ComponentType<*> with flow 0.53
    navigationOptions?: any,
  },
}
