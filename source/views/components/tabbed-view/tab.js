// @flow

type TabPropsType = {
  id: string,
  icon: string,
  title: string,
  render: () => ReactElement<*>,
};

export const Tab = (props: TabPropsType) =>
  props.children ? props.children : null
