import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 110+150+130+140+135+110 = 775, minus 5 transitions * 22 = 110 -> 665
export const RemotionRoot: React.FC = () => (
  <Composition id="main" component={MainVideo} durationInFrames={665} fps={30} width={1920} height={1080} />
);
