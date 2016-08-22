// @flow
export type OtherModeType = {
  name: string,
  description: string,
  url: string,
};

export type BusStopType = {
  location: string,
  times: string[],
};

export type BusLineType = {
  schedule: BusStopType[],
};
