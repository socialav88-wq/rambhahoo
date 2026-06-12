-- ============================================
-- RAMBHAHOO LOCALITIES SEED DATA
-- ============================================

-- Ensure the localities table is populated with the foundational Hyderabad areas
-- using ON CONFLICT DO NOTHING so this script is idempotent.

INSERT INTO public.localities (name, slug, emoji, description, tagline) VALUES
('Hyderabad', 'hyderabad', '🏙️', 'The City of Pearls — all things Hyderabad', 'Ek dum jhakaas!'),
('Gachibowli', 'gachibowli', '💻', 'IT hub, stadiums, and weekend vibes', 'Where code meets chai'),
('Madhapur', 'madhapur', '🍕', 'Food streets, startups, and nightlife', 'Always hungry, always hustling'),
('Hi-Tech City', 'hitech-city', '🏢', 'Corporate life, traffic jams, and biryani breaks', 'Techie capital of Telangana'),
('Kukatpally', 'kukatpally', '🏘️', 'Housing boards, KPHB colony, and local markets', 'OG residential vibes'),
('Banjara Hills', 'banjara-hills', '✨', 'Posh restaurants, boutiques, and weekend plans', 'Where Hyderabad gets fancy'),
('Jubilee Hills', 'jubilee-hills', '🎬', 'Film industry, cafes, and the good life', 'Tollywood''s backyard'),
('Ameerpet', 'ameerpet', '📚', 'Coaching centers, street food, and metro connections', 'Skills upgrade zone'),
('Begumpet', 'begumpet', '✈️', 'Old airport area, military zones, and heritage', 'Where old meets new'),
('Secunderabad', 'secunderabad', '🚂', 'Twin city, railway hub, and cantonment vibes', 'The twin that never sleeps'),
('Kondapur', 'kondapur', '🏗️', 'Rapidly growing IT corridor and apartment life', 'New Hyderabad rising'),
('Miyapur', 'miyapur', '🚇', 'Metro terminal, affordable living, and growth', 'End of the line, start of the vibe'),
('Dilsukhnagar', 'dilsukhnagar', '🛍️', 'Shopping paradise, street food, and local buzz', 'Bargain hunter''s paradise'),
('LB Nagar', 'lb-nagar', '🌳', 'Residential calm, outer ring road, and community', 'Peaceful vibes only'),
('Uppal', 'uppal', '🏭', 'Industrial area meets residential growth', 'East side represent')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline;
