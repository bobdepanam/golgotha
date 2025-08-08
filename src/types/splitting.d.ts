declare module "splitting" {
  interface SplittingOptions {
    target?: string;
    by?: string;
  }

  interface SplittingResult {
    el: HTMLElement;
    words?: HTMLElement[];
    chars?: HTMLElement[];
    lines?: HTMLElement[];
  }

  export default function splitting(options?: SplittingOptions): SplittingResult[];
}
