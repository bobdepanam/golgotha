// /simple/[slug] — page produit SIMPLE (BSTRDZ 7.0.3b).
// Composition de Simple (photo/[slug]) : visuel (55 %) + informations (45 %), retour,
// compteur, précédent / suivant. Visuels originaux (pleine résolution), médias multiples,
// audio (lecteur commun de Golgotha). Données : content/simple/ (src/generated/simple.json).
import AudioPlayer from '@/components/audio/AudioPlayer';
import { BackControl } from '@/components/simple/product/BackControl';
import { MediaStage } from '@/components/simple/product/MediaStage';
import { MultiMediaStage } from '@/components/simple/product/MultiMediaStage';
import { ProductInfo } from '@/components/simple/product/ProductInfo';
import { stageMedia } from '@/components/simple/product/stageMedia';
import { getAllProducts, getAllProductSlugs, getProductBySlug } from '@/lib/content/simple';
import { toProductDisplay } from '@/lib/content/simple-display';
import styles from '@/styles/simple/SimpleProduct.module.scss';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = { params: { slug: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const p = getProductBySlug(params.slug);
  if (!p) return { title: 'Simple', robots: { index: false, follow: false } };
  const title = p.seo.title ?? p.title;
  const description = p.seo.description ?? p.tagline ?? (p.excerpt || 'Simple — BSTRDZ');
  const image = p.thumb?.url ?? p.seo.image ?? undefined; // image statique (jamais une vidéo)
  return {
    title,
    description,
    alternates: { canonical: `/simple/${p.slug}` },
    openGraph: { type: 'website', title, description, url: `/simple/${p.slug}`, images: image ? [{ url: image }] : [] },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
    ...(p.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default function SimpleProductPage({ params }: Props) {
  const products = getAllProducts();
  const idx = products.findIndex((p) => p.slug === params.slug);
  if (idx < 0) notFound();
  const product = products[idx];
  const prev = idx > 0 ? products[idx - 1] : null;
  const next = idx < products.length - 1 ? products[idx + 1] : null;
  const counter = `${String(idx + 1).padStart(3, '0')} / ${String(products.length).padStart(3, '0')}`;
  const media = stageMedia(product);
  const isMulti = media.length > 1;
  const info = toProductDisplay(product);

  return (
    <div className={styles.root} data-layout={isMulti ? 'multi' : 'single'}>
      <div className={styles.stageColumn} data-lenis-prevent="">
        {isMulti ? (
          <MultiMediaStage media={media} title={product.title} />
        ) : media[0] ? (
          <MediaStage media={media[0]} title={product.title} blurDataURL={product.blurDataURL} poster={product.thumb?.url} />
        ) : null}
      </div>

      <div className={styles.infoColumn} data-lenis-prevent="">
        <div className={styles.top}>
          <BackControl />
          <span className={styles.counter}>{counter}</span>
        </div>

        <ProductInfo info={info} />

        {product.audio && (
          <div className={styles.audio}>
            <AudioPlayer src={product.audio} title={product.title} active />
          </div>
        )}

        <nav className={styles.nav} aria-label="Produits">
          {prev ? (
            <Link href={`/simple/${prev.slug}`} className={styles.navLink}>
              ← Prev
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/simple/${next.slug}`} className={styles.navLink}>
              Next →
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
