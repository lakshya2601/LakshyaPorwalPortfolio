import Scene from "@/components/Scene";
import HUD from "@/components/HUD";
import Intro from "@/components/Intro";
import Sections from "@/components/Sections";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Scene />
      <HUD />
      <main>
        <Sections />
      </main>
      <Intro />
    </>
  );
}
