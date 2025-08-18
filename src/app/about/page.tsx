// ✅ pas de "use client" ici
import type { Metadata } from 'next';
import AboutClient from './Aboutclient';

export const metadata: Metadata = {
  title: "Talk | Talk",
  description: "About Golgotha universe",
};

export default function AboutPage() {
  return <AboutClient />;
}
