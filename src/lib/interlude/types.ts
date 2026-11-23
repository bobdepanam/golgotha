/**
 * Interlude (adapté pour Next.js) : types partagés par le moteur et les transitions.
 * D'après codrops/interlude (MIT, voir ./LICENSE).
 */

export type Direction = 'forward' | 'back';

/** Ce qu'une transition reçoit. */
export interface TransitionContext {
  /** La couche plein écran au-dessus de la page : les transitions dessinent dedans. */
  root: HTMLElement;
  /** Le contenu de la page (#pageContent) : l'ancienne page pendant `leave`, la nouvelle pendant `enter`. */
  content: HTMLElement;
  transition: string;
  from: URL;
  to: URL;
  direction: Direction;
  trigger: Element | undefined;
  /** D'où part la navigation à l'écran (pointeur, ou centre du déclencheur), en px. */
  origin: { x: number; y: number };
  reducedMotion: boolean;
  /** Toujours `false` ici : la première page n'est jamais couverte. */
  initial: boolean;
  entrance: number | false;
}

export type Awaitable = void | PromiseLike<unknown> | gsap.core.Animation;

export interface Transition {
  name: string;
  /** Couvre la page actuelle. Doit être synchrone pour fonctionner aussi au retour arrière. */
  leave(context: TransitionContext): Awaitable;
  /** Révèle la nouvelle page. Construire ses éléments avant le premier `await`. */
  enter(context: TransitionContext): Awaitable;
  /** Juste après l'arrivée de la nouvelle page, avant `enter`. */
  prepare?(context: TransitionContext): void;
  /** `false` : la transition masque la page elle-même (copie de l'ancienne page, etc.). */
  solidCover?: boolean;
  entrance?: number | false;
}
