// types/imagesloaded.d.ts
declare module "imagesloaded" {
  interface ImagesLoadedOptions {
    background?: boolean | string;
  }

  interface ImagesLoadedCallback {
    (instance: any): void;
  }

  interface ImagesLoaded {
    on(event: string, callback: ImagesLoadedCallback): void;
  }

  function imagesLoaded(
    elem: Element | NodeList | string,
    options?: ImagesLoadedOptions,
    callback?: ImagesLoadedCallback
  ): ImagesLoaded;

  export default imagesLoaded;
}
