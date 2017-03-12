// @flow

type TabPropsType = {
  id: string,
  icon: string,
  title: string,
  children?: () => ReactClass<*>,
};

export const Tab = (props: TabPropsType) =>
  props.children ? props.children : null
