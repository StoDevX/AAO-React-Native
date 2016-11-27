// @flow
export type MenuItemType = {
  name: string,
  price: string,
};

export type MenuSectionType = {
  name: string,
  items: MenuItemType[],
  subtext: string,
};
