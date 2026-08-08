import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 110+150+130+140+135+140+110 = 915, minus 6 transitions * 22 = 132 -> 783
export const RemotionRoot: React.FC = () => (
  <Composition id="main" component={MainVideo} durationInFrames={783} fps={30} width={1920} height={1080} />
);
