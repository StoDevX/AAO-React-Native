// @flow

export type StoryType = {
  'dc:creator': string[],
  category: string[],
  'content:encoded': string[],
  description: string[],
  link: string[],
  pubDate: string[],
  title: string[],
};

export type FeedResponseType = {
  rss: {
    channel: Array<{
      title: string[],
      'atom:link': mixed[],
      link: string[],
      description: string[],
      item: StoryType[],
    }>,
  }
};
