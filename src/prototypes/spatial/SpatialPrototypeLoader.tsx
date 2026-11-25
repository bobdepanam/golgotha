'use client';

// Chargement différé, sans rendu serveur : Three.js / R3F ne sont téléchargés que
// lorsque le prototype est réellement affiché (jamais dans les autres routes).
import dynamic from 'next/dynamic';
import type { SpatialItem } from './types';

const SpatialPrototype = dynamic(() => import('./SpatialPrototype'), { ssr: false });

export default function SpatialPrototypeLoader({ items }: { items: SpatialItem[] }) {
  return <SpatialPrototype items={items} />;
}
