import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, X } from "lucide-react";
import { useMusicMode } from "@/hooks/use-music-mode";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Reliable free lofi / chill streams (direct MP3/AAC, CORS-friendly for <audio>)
const STATIONS = [
  { name: "Groove Salad (SomaFM)", url: "https://ice1.somafm.com/groovesalad-128-mp3" },
  { name: "Chillhop — FluxFM", url: "https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/" },
  { name: "Deep Space One (SomaFM)", url: "https://ice1.somafm.com/deepspaceone-128-mp3" },
  { name: "Fluid (SomaFM)", url: "https://ice1.somafm.com/fluid-128-mp3" },
  { name: "Lush (SomaFM)", url: "https://ice1.somafm.com/lush-128-mp3" },
];

export function LofiPlayer() {
  const { enabled } = useMusicMode();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [stationIdx, setStationIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create audio element lazily (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio();
    // Do NOT set crossOrigin — Icecast streams don't send CORS headers and
    // would fail to play if we ask the browser to enforce them.
    a.preload = "none";
    a.volume = volume;
    audioRef.current = a;
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onErr = () => { setLoading(false); setPlaying(false); setError("Stream unavailable — try next"); };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("error", onErr);
    return () => {
      a.pause();
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("error", onErr);
      audioRef.current = null;
    };
     
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Pause when music mode turns off
  useEffect(() => {
    if (!enabled && audioRef.current) {
      audioRef.current.pause();
    }
    if (enabled) setHidden(false);
  }, [enabled]);

  const loadAndPlay = async (idx: number) => {
    const a = audioRef.current;
    if (!a) return;
    setError(null);
    setLoading(true);
    a.pause();
    a.src = STATIONS[idx].url;
    try {
      await a.play();
    } catch (e) {
      setLoading(false);
      setError("Tap play to start audio");
    }
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); return; }
    if (!a.src) { await loadAndPlay(stationIdx); return; }
    try { await a.play(); } catch { setError("Tap play again"); }
  };

  const next = async () => {
    const nextIdx = (stationIdx + 1) % STATIONS.length;
    setStationIdx(nextIdx);
    await loadAndPlay(nextIdx);
  };

  if (!enabled || hidden) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[280px] rounded-2xl border border-primary/30 bg-background/85 backdrop-blur-xl shadow-glow p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("size-8 rounded-lg bg-gradient-primary grid place-items-center", playing && "animate-pulse")}>
            <Music className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-primary">Lofi radio</p>
            <p className="text-xs font-medium truncate">{STATIONS[stationIdx].name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-6" onClick={() => setHidden(true)} aria-label="Hide player">
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="icon" onClick={toggle} disabled={loading} className="size-9 bg-gradient-primary text-primary-foreground" aria-label={playing ? "Pause" : "Play"}>
          {loading ? <span className="size-3 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button size="icon" variant="outline" onClick={next} className="size-9" aria-label="Next station">
          <SkipForward className="size-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setMuted((m) => !m)} className="size-9" aria-label={muted ? "Unmute" : "Mute"}>
          {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Slider
          value={[muted ? 0 : Math.round(volume * 100)]}
          onValueChange={(v) => { setVolume(v[0] / 100); if (muted) setMuted(false); }}
          max={100}
          className="flex-1"
          aria-label="Volume"
        />
      </div>
      {error && <p className="mt-2 text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
