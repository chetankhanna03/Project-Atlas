import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-panel p-5 rounded-2xl border border-ocean-500/20 space-y-4 animate-pulse">
    <div className="h-5 bg-ocean-500/20 rounded-md w-3/4 skeleton-shimmer"></div>
    <div className="h-4 bg-ocean-500/10 rounded-md w-1/2 skeleton-shimmer"></div>
    <div className="space-y-2 pt-2">
      <div className="h-3 bg-ocean-500/10 rounded-md w-full skeleton-shimmer"></div>
      <div className="h-3 bg-ocean-500/10 rounded-md w-5/6 skeleton-shimmer"></div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="glass-panel rounded-2xl overflow-hidden p-4 border border-ocean-500/20">
    <div className="h-10 bg-ocean-500/20 rounded-lg mb-4 skeleton-shimmer"></div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-ocean-500/10 rounded-md skeleton-shimmer w-full"></div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="glass-panel p-6 rounded-2xl border border-ocean-500/20 space-y-4 animate-pulse h-72 flex flex-col justify-end">
    <div className="flex items-end space-x-4 h-48 w-full">
      <div className="w-1/6 bg-ocean-500/20 h-1/3 rounded-t-md skeleton-shimmer"></div>
      <div className="w-1/6 bg-ocean-500/30 h-2/3 rounded-t-md skeleton-shimmer"></div>
      <div className="w-1/6 bg-ocean-500/20 h-1/2 rounded-t-md skeleton-shimmer"></div>
      <div className="w-1/6 bg-ocean-500/40 h-5/6 rounded-t-md skeleton-shimmer"></div>
      <div className="w-1/6 bg-ocean-500/20 h-2/5 rounded-t-md skeleton-shimmer"></div>
      <div className="w-1/6 bg-ocean-500/30 h-3/4 rounded-t-md skeleton-shimmer"></div>
    </div>
  </div>
);
