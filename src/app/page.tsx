import Scene from "@/components/Scene";
import HUD from "@/components/HUD";
import Intro from "@/components/Intro";
import Sections from "@/components/Sections";
import SmoothScroll from "@/components/SmoothScroll";
import PhotoLayers from "@/components/PhotoLayers";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Scene />
      <PhotoLayers />
      <div className="sky-shade" aria-hidden="true" />
      <HUD />
      <main>
        <Sections />
      </main>
      <Intro />
    </>
  );
}
