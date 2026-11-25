// État de navigation de /projects pour la session (onglet) : mode d'affichage et position
// de chaque mode (retour depuis une page projet, bascule Grid ⇄ List). Réinitialisé au
// rechargement. Le filtre, lui, reste porté par l'URL (?cat=).
import type { ListMemory } from '@/components/simple/list/types';

export const projectsViewState: {
  /** 'spatial' = Grid (identifiant du sélecteur partagé avec Simple) */
  mode: 'spatial' | 'list';
  gridScrollY: number;
  list: ListMemory;
} = {
  mode: 'spatial',
  gridScrollY: 0,
  list: { scrollY: 0 },
};
