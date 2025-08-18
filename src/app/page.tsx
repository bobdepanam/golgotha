// src/app/page.tsx (ou app/home/page.tsx selon ta structure)

import HomeGridLoop from "@/components/homeGridLoop/HomeGridLoop";
import styles from "@/styles/pages/HomePage.module.scss";

export default function HomePage() {
  return (
    <main className={styles.homeMain}>
      <HomeGridLoop />
    </main>
  );
}
