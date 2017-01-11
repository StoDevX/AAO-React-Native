// @flow

export type StoryType = {
  author: string,
  categories: string[],
  content: string,
  contentSnippet: string,
  link: string,
  publishedDate: string,
  title: string,
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
