import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./components/PersistentBackground";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneUpload } from "./scenes/SceneUpload";
import { SceneKit } from "./scenes/SceneKit";
import { SceneTools } from "./scenes/SceneTools";
import { SceneGamify } from "./scenes/SceneGamify";
import { SceneOutro } from "./scenes/SceneOutro";
import { SceneTour } from "./scenes/SceneTour";

const t = springTiming({ config: { damping: 200 }, durationInFrames: 22 });

export const MainVideo: React.FC = () => (
  <AbsoluteFill>
    <PersistentBackground />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110}>
        <SceneIntro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={150}>
        <SceneUpload />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={130}>
        <SceneKit />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={140}>
        <SceneTools />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={135}>
        <SceneGamify />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={140}>
        <SceneTour />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={110}>
        <SceneOutro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
