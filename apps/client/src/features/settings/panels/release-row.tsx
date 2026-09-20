import { useState } from "react";
import { HAIRLINE_WIDTH } from '@/constants/layout';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSettingsPalette } from "@/components/settings-surface";
import { formatReleaseShort, formatReleaseTime, type VersionInfo } from "../utils/about";
import { aboutStyles } from "../utils/about-styles";
/** One collapsible release row in the changelog timeline. */
export function ReleaseRow({
  release,
  current,
  defaultOpen
}: {
  release: NonNullable<VersionInfo['timeline']>[number];
  current: boolean;
  defaultOpen: boolean;
}) {
  const p = useSettingsPalette();
  const [open, setOpen] = useState(defaultOpen);
  const notes = release.notes ?? [];
  const featureTotal = notes.filter(note => note.type === 'feature').length;
  const fixTotal = notes.filter(note => note.type === 'fix').length;
  const otherTotal = notes.filter(note => note.type === 'other').length;
  const countText = [featureTotal && `${featureTotal} 新功能`, fixTotal && `${fixTotal} 修复`, otherTotal && `${otherTotal} 其他`].filter(Boolean).join(' · ') || '无变更记录';
  return <div>
      <button onClick={() => setOpen(value => !value)} role="button" aria-label={`${release.tag}，发布于 ${formatReleaseTime(release.published_at)}，${countText}`}>
        <div />
        <span>
          {release.tag}
        </span>
        <span className={"  text-text-tertiary"}>
          {formatReleaseShort(release.published_at)}
        </span>
        <span className={"  text-text-tertiary"}>
          {countText}
        </span>
        {current ? <div className={"  bg-muted"}>
            <span className={"  text-text-secondary"}>当前</span>
          </div> : null}
        {open ? <ChevronUp size={14} color={p.textTertiary} strokeWidth={2} /> : <ChevronDown size={14} color={p.textTertiary} strokeWidth={2} />}
      </button>
      {open ? <div>
          {(['feature', 'fix', 'other'] as const).map(type => {
        const items = notes.filter(note => note.type === type);
        if (!items.length) return null;
        const label = type === 'feature' ? '新功能' : type === 'fix' ? '修复' : '其他';
        return <div key={type} className={"block"}>
                <span className={"  text-text-secondary"}>
                  {label} · {items.length}
                </span>
                {items.map((note, index) => <div key={`${note.commit}-${index}`} className={"block"}>
                    <span className={"  text-foreground"}>
                      {note.title}
                    </span>
                    {note.commit ? <span className={"  text-text-tertiary"}>{note.commit}</span> : null}
                  </div>)}
              </div>;
      })}
          {!notes.length ? <span className={"  text-text-tertiary"}>无变更记录</span> : null}
        </div> : null}
    </div>;
}
