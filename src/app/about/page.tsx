// ✅ pas de "use client" ici
import type { Metadata } from 'next';
import AboutClient from './Aboutclient';

export const metadata: Metadata = {
  title: "À propos | Golgotha",
  description: "À propos du projet Golgotha et de son univers visuel.",
};

export default function AboutPage() {
  return <AboutClient />;
}
