'use client';

import DiscussionCard from './DiscussionCard';
import MemeCard from './MemeCard';
import PollCard from './PollCard';

export default function PostCard({ post }) {
  if (!post) return null;

  switch (post.post_type) {
    case 'meme':
      return <MemeCard post={post} />;
    case 'poll':
      return <PollCard post={post} />;
    case 'discussion':
    default:
      return <DiscussionCard post={post} />;
  }
}
