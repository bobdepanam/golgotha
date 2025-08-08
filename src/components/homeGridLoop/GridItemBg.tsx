type BgMedia = {
  type: "video" | "image";
  src: string;
  poster?: string;
  alt?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
};

type Props = {
  media: BgMedia;
};

export default function GridItemBg({ media }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {media.type === "video" ? (
        <video
          src={media.src}
          poster={media.poster}
          autoPlay={media.autoPlay}
          loop={media.loop}
          muted={media.muted}
          playsInline={media.playsInline}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <img
          src={media.src}
          alt={media.alt || ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
