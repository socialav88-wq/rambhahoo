'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { MapPin } from 'lucide-react';

export default function CreateLocalityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏘️',
    tagline: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to create a locality.');
        router.push('/login');
        return;
      }

      // Generate a simple slug
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { data, error } = await supabase
        .from('localities')
        .insert({
          name: formData.name,
          slug,
          emoji: formData.emoji,
          tagline: formData.tagline,
          description: formData.description,
          member_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Auto join the locality the user just created
      await supabase.from('profiles').update({ locality_id: data.id }).eq('id', user.id);

      router.push(`/${slug}`);
    } catch (error) {
      alert(error.message || 'Failed to create locality');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <MapPin className="text-purple-secondary" size={24} />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
            Create Locality
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Emoji</label>
              <input
                type="text"
                required
                maxLength={2}
                value={formData.emoji}
                onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-center text-xl text-text-primary placeholder:text-text-dim focus:outline-none focus:border-purple-secondary focus:ring-1 focus:ring-purple-secondary/50 transition-all"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Locality Name</label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="e.g. Jubilee Hills"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-purple-secondary focus:ring-1 focus:ring-purple-secondary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Tagline</label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. The heartbeat of the city"
              value={formData.tagline}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-purple-secondary focus:ring-1 focus:ring-purple-secondary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea
              required
              maxLength={300}
              rows={3}
              placeholder="Describe what makes this neighborhood special..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-purple-secondary focus:ring-1 focus:ring-purple-secondary/50 transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="bg-purple-secondary hover:bg-purple-600">
              Create Locality
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
