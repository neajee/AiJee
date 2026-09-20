const BAR_COUNT = 5;
const BAR_SCALES = [0.6, 0.85, 1, 0.85, 0.6];
export function WaveformBars({
  audioLevel
}: {
  audioLevel: number;
}) {
  return <div className="flex h-[18px] items-center gap-0.5">
      {BAR_SCALES.map((scale, i) => <div key={i} className="w-[3px] rounded-sm bg-red-500 transition-[height] duration-75" style={{ height: `${Math.max(3, Math.round(18 * Math.max(0.15, audioLevel * scale)))}px` }} />)}
    </div>;
}
