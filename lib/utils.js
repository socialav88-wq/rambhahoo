import { formatDistanceToNowStrict } from 'date-fns';

export function timeAgo(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = formatDistanceToNowStrict(d, { addSuffix: false });
  // Shorten: "5 minutes" -> "5m", "2 hours" -> "2h"
  return result
    .replace(/ seconds?/, 's')
    .replace(/ minutes?/, 'm')
    .replace(/ hours?/, 'h')
    .replace(/ days?/, 'd')
    .replace(/ weeks?/, 'w')
    .replace(/ months?/, 'mo')
    .replace(/ years?/, 'y');
}

export function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 60)
    + '-' + Math.random().toString(36).substring(2, 8);
}

export function getInitials(name) {
  if (!name || name.trim() === '') return 'U';
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'U';
}

export function truncate(str, maxLength = 150) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getLocalityBySlug(slug) {
  const { LOCALITIES } = require('./constants');
  return LOCALITIES.find(l => l.slug === slug);
}

export function isValidLocality(slug) {
  const { VALID_LOCALITY_SLUGS } = require('./constants');
  return VALID_LOCALITY_SLUGS.includes(slug);
}

export function getReactionEmoji(key) {
  const { REACTIONS } = require('./constants');
  const reaction = REACTIONS.find(r => r.key === key);
  return reaction ? reaction.emoji : '👍';
}

export function randomId() {
  return Math.random().toString(36).substring(2, 15);
}
