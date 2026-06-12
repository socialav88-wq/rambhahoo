'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/feed/PostCard';
import Avatar from '@/components/ui/Avatar';
import { User, MapPin, FileText, Flame } from 'lucide-react';

export default function SearchTabs({ results, query }) {
  const [activeTab, setActiveTab] = useState('posts');
  const { posts = [], users = [], localities = [] } = results || {};

  const tabs = [
    { id: 'posts', label: 'Posts', count: posts.length, icon: FileText },
    { id: 'users', label: 'People', count: users.length, icon: User },
    { id: 'localities', label: 'Localities', count: localities.length, icon: MapPin },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-primary text-blue-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-blue-primary/10 text-blue-primary' : 'bg-bg-elevated text-text-dim'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'posts' && (
          posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState message={`No posts found matching "${query}"`} />
          )
        )}

        {activeTab === 'users' && (
          users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border hover:border-blue-primary/50 transition-colors"
                >
                  <Avatar src={user.avatar_url} name={user.display_name || user.username} size="lg" />
                  <div>
                    <h3 className="font-semibold text-text-primary">{user.display_name || user.username}</h3>
                    <p className="text-sm text-text-dim">@{user.username}</p>
                    {user.bio && <p className="text-xs text-text-muted mt-1 line-clamp-1">{user.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message={`No people found matching "${query}"`} />
          )
        )}

        {activeTab === 'localities' && (
          localities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {localities.map(loc => (
                <Link
                  key={loc.id}
                  href={`/${loc.slug}`}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-bg-card border border-border hover:border-blue-primary/50 text-center transition-all group"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{loc.emoji}</span>
                  <h3 className="font-semibold text-text-primary">{loc.name}</h3>
                  {loc.tagline && <p className="text-xs text-text-dim mt-1">{loc.tagline}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message={`No localities found matching "${query}"`} />
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-xl border border-border border-dashed text-center">
      <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
        <Flame size={32} className="text-text-dim" />
      </div>
      <p className="text-text-muted">{message}</p>
    </div>
  );
}
