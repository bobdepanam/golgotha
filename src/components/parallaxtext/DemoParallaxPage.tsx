import ParallaxText from "@/components/ParallaxText";

export default function DemoParallaxPage() {
  const sections = [
    {
      imageSrc: "/images/hero1.jpg",
      heading: "Immersion visuelle",
      subheading: "Chapitre I",
      contentHeading: "Une ouverture sensorielle",
      contentText:
        "Plongez dans un univers où l’image prend vie au fil du défilement. L’espace s’étire, se contracte, se révèle.",
    },
    {
      videoSrc: "/videos/demo.mp4",
      heading: "Énergie en mouvement",
      subheading: "Chapitre II",
      contentHeading: "Fluidité et contraste",
      contentText:
        "La vidéo accompagne le regard et accentue la profondeur, créant un jeu entre l’éphémère et le constant.",
    },
    {
      imageSrc: "/images/hero2.jpg",
      heading: "Texte & matière",
      subheading: "Chapitre III",
      content: (
        <>
          <h3>Expérimentation</h3>
          <p>
            Ici on injecte directement du JSX, donc libre à toi de mettre des
            listes, des blocs typés, ou même un lien externe.
          </p>
        </>
      ),
    },
  ];

  return <ParallaxText sections={[sections[0]]} />; // 👈 active seulement la première
}
