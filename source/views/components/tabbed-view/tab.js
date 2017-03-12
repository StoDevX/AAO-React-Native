// @flow

type TabPropsType = {
  id: string,
  icon: string,
  title: string,
  children?: () => React$Component<*, *, *>,
}

export const Tab = (props: TabPropsType) => props
