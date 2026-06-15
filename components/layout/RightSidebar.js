import ExploreWidgets from '@/components/trending/ExploreWidgets';

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-[72px] space-y-4 pb-8 max-h-[calc(100vh-72px)] overflow-y-auto no-scrollbar">
        
        <ExploreWidgets />

        {/* App download CTA */}
        <div className="bg-gradient-to-br from-blue-primary/5 to-purple-secondary/5 rounded-xl border border-border shadow-sm p-4 text-center">
          <p className="text-sm font-medium text-text-primary">📱 Get the Rambhahoo app</p>
          <p className="text-xs text-text-muted mt-1">Install for the best experience</p>
        </div>
      </div>
    </aside>
  );
}
