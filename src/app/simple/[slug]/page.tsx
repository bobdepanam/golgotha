// /simple/[slug] — page produit SIMPLE (BSTRDZ 7.0.3b).
// Composition de Simple (photo/[slug]) : visuel (55 %) + informations (45 %), retour,
// compteur, précédent / suivant. Visuels originaux (pleine résolution), médias multiples,
// audio (lecteur commun de Golgotha). Données : content/simple/ (src/generated/simple.json).
import AudioPlayer from '@/components/audio/AudioPlayer';
import SimpleProductReady from '@/components/simple/transition/SimpleProductReady';
import BackControl from '@/components/ui/BackControl';
import { MediaStage } from '@/components/simple/product/MediaStage';
import { MultiMediaStage } from '@/components/simple/product/MultiMediaStage';
import { ProductInfo } from '@/components/simple/product/ProductInfo';
import { stageMedia } from '@/components/simple/product/stageMedia';
import { getAllProducts, getAllProductSlugs, getProductBySlug } from '@/lib/content/simple';
import { toProductDisplay } from '@/lib/content/simple-display';
import styles from '@/styles/simple/SimpleProduct.module.scss';
import type { Metadata } from 'next';
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
  const media = stageMedia(product);
  const isMulti = media.length > 1;
  const info = toProductDisplay(product);

  return (
    <div className={styles.root} data-layout={isMulti ? 'multi' : 'single'}>
      {/* Back mutualisé (7.0.10) : retour à la grille par la transition interne de Simple */}
      <BackControl href="/simple" escape />
      <SimpleProductReady />
      <div className={styles.stageColumn} data-lenis-prevent="" data-simple-stage="">
        {isMulti ? (
          <MultiMediaStage media={media} title={product.title} />
        ) : media[0] ? (
          <MediaStage media={media[0]} title={product.title} blurDataURL={product.blurDataURL} poster={product.thumb?.url} />
        ) : null}
      </div>

      <div className={styles.infoColumn} data-lenis-prevent="" data-simple-info="">
        <ProductInfo info={info} />

        {product.audio && (
          <div className={styles.audio}>
            <AudioPlayer src={product.audio} title={product.title} origin={`/simple/${product.slug}`} active />
          </div>
        )}

      </div>
    </div>
  );
}
