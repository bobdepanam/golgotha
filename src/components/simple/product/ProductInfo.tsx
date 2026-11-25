// Informations produit (Simple : product/ProductInfo.tsx) : en-tête, texte long, caractéristiques.
// Affichage pur (composant serveur). Seules les informations connues sont affichées.
import type { ProductDisplay } from '@/lib/content/simple-display';
import styles from '@/styles/simple/SimpleProduct.module.scss';

export function ProductInfo({ info }: { info: ProductDisplay }) {
  return (
    <div className={styles.info}>
      <div className={styles.infoHeader}>
        {info.heroTag && <p className={styles.heroTag}>Collection piece</p>}
        {info.meta && <p className={styles.meta}>{info.meta}</p>}
        <h1 className={styles.title}>{info.title}</h1>
        {info.tagline && <p className={styles.tagline}>{info.tagline}</p>}
      </div>

      {info.bodyHtml ? (
        <div className={styles.description} dangerouslySetInnerHTML={{ __html: info.bodyHtml }} />
      ) : (
        info.bodyText.map((p, i) => (
          <p key={i} className={styles.description}>
            {p}
          </p>
        ))
      )}

      {info.specs.length > 0 && (
        <dl className={styles.specs}>
          {info.specs.map((s) => (
            <div key={s.label} className={styles.specRow}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

    </div>
  );
}
