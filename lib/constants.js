export const APP_NAME = 'Rambhahoo';
export const APP_DESCRIPTION = 'Hyderabad\'s hyperlocal social network — discussions, memes, polls & neighborhood culture';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.rambhahoo.com';

export const REACTIONS = [
  { emoji: '💀', label: 'Dead', key: 'skull' },
  { emoji: '😂', label: 'ROFL', key: 'rofl' },
  { emoji: '🔥', label: 'Fire', key: 'fire' },
  { emoji: '😭', label: 'Crying', key: 'crying' },
  { emoji: '🥵', label: 'Hot', key: 'hot' },
];

export const POST_TYPES = [
  { value: 'discussion', label: 'Discussion', icon: 'MessageSquare', description: 'Start a conversation' },
  { value: 'image', label: 'Image', icon: 'Image', description: 'Share a picture or meme' },
  { value: 'poll', label: 'Poll', icon: 'BarChart3', description: 'Create a poll' },
  { value: 'event', label: 'Event', icon: 'Calendar', description: 'Plan a local meetup' },
];

export const LOCALITIES = [
  { name: 'Hyderabad', slug: 'hyderabad', emoji: '🏙️', description: 'The City of Pearls — all things Hyderabad', tagline: 'Ek dum jhakaas!' },
  { name: 'Gachibowli', slug: 'gachibowli', emoji: '💻', description: 'IT hub, stadiums, and weekend vibes', tagline: 'Where code meets chai' },
  { name: 'Madhapur', slug: 'madhapur', emoji: '🍕', description: 'Food streets, startups, and nightlife', tagline: 'Always hungry, always hustling' },
  { name: 'Hi-Tech City', slug: 'hitech-city', emoji: '🏢', description: 'Corporate life, traffic jams, and biryani breaks', tagline: 'Techie capital of Telangana' },
  { name: 'Kukatpally', slug: 'kukatpally', emoji: '🏘️', description: 'Housing boards, KPHB colony, and local markets', tagline: 'OG residential vibes' },
  { name: 'Banjara Hills', slug: 'banjara-hills', emoji: '✨', description: 'Posh restaurants, boutiques, and weekend plans', tagline: 'Where Hyderabad gets fancy' },
  { name: 'Jubilee Hills', slug: 'jubilee-hills', emoji: '🎬', description: 'Film industry, cafes, and the good life', tagline: 'Tollywood\'s backyard' },
  { name: 'Ameerpet', slug: 'ameerpet', emoji: '📚', description: 'Coaching centers, street food, and metro connections', tagline: 'Skills upgrade zone' },
  { name: 'Begumpet', slug: 'begumpet', emoji: '✈️', description: 'Old airport area, military zones, and heritage', tagline: 'Where old meets new' },
  { name: 'Secunderabad', slug: 'secunderabad', emoji: '🚂', description: 'Twin city, railway hub, and cantonment vibes', tagline: 'The twin that never sleeps' },
  { name: 'Kondapur', slug: 'kondapur', emoji: '🏗️', description: 'Rapidly growing IT corridor and apartment life', tagline: 'New Hyderabad rising' },
  { name: 'Miyapur', slug: 'miyapur', emoji: '🚇', description: 'Metro terminal, affordable living, and growth', tagline: 'End of the line, start of the vibe' },
  { name: 'Dilsukhnagar', slug: 'dilsukhnagar', emoji: '🛍️', description: 'Shopping paradise, street food, and local buzz', tagline: 'Bargain hunter\'s paradise' },
  { name: 'LB Nagar', slug: 'lb-nagar', emoji: '🌳', description: 'Residential calm, outer ring road, and community', tagline: 'Peaceful vibes only' },
  { name: 'Uppal', slug: 'uppal', emoji: '🏭', description: 'Industrial area meets residential growth', tagline: 'East side represent' },
];

export const VALID_LOCALITY_SLUGS = LOCALITIES.map(l => l.slug);

export const FEED_FILTERS = [
  { value: 'hot', label: '🔥 Hot' },
  { value: 'new', label: '✨ New' },
  { value: 'top', label: '🏆 Top' },
  { value: 'discussed', label: '💬 Discussed' },
];

export const BOTTOM_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'Explore', href: '/search', icon: 'Compass' },
  { label: 'Create', href: '/create', icon: 'PlusCircle', isSpecial: true },
  { label: 'Trending', href: '/trending', icon: 'TrendingUp' },
  { label: 'Profile', href: '/profile', icon: 'User' },
];
