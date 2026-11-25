'use client';

// Chargement différé, sans rendu serveur : Three.js / R3F ne sont téléchargés que sur /simple.
import dynamic from 'next/dynamic';
import type { SpatialItem } from './types';

const SimpleSpatial = dynamic(() => import('./SimpleSpatial'), { ssr: false });

export default function SimpleSpatialLoader({ items, category }: { items: SpatialItem[]; category?: string }) {
  return <SimpleSpatial items={items} category={category} />;
}
