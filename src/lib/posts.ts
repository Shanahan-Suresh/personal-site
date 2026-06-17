import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** All non-draft posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** e.g. "5 Jun 2026" — for list/card views. */
export function formatPostDate(date: Date): string {
  return shortFmt.format(date);
}

/** e.g. "5 June 2026" — for the post header. */
export function formatPostDateLong(date: Date): string {
  return longFmt.format(date);
}
