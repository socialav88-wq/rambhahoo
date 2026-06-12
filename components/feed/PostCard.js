'use client';

import DiscussionCard from './DiscussionCard';
import ImageCard from './ImageCard';
import PollCard from './PollCard';

export default function PostCard({ post }) {
  if (!post) return null;

  switch (post.post_type) {
    case 'image':
      return <ImageCard post={post} />;
    case 'poll':
      return <PollCard post={post} />;
    case 'discussion':
    default:
      return <DiscussionCard post={post} />;
  }
}
