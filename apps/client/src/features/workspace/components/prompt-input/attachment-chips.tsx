import { X, FileText, ImageIcon } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { Attachment } from '../../utils/prompt-input';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
interface AttachmentChipsProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}
export function AttachmentChips({
  attachments,
  onRemove
}: AttachmentChipsProps) {
  const theme = usePromptTheme();
  if (attachments.length === 0) return null;
  const imageAtts = attachments.filter(a => a.type === 'image');
  const fileAtts = attachments.filter(a => a.type !== 'image');
  return <div className="flex flex-col">
      {imageAtts.length > 0 && <div className="flex flex-col">
          {imageAtts.map(att => <div key={att.id} className={"  border-border"}>
              {att.preview ? <img src={att.preview} alt={att.name} className="size-16 rounded object-cover" /> : <div>
                  <ImageIcon size={18} color={theme.textMuted} strokeWidth={1.8} />
                </div>}
              <button onClick={() => onRemove(att.id)} role="button" aria-label="Remove image">
                <X size={11} color={theme.isDark ? '#fff' : '#333'} strokeWidth={2.5} />
              </button>
            </div>)}
        </div>}

      {fileAtts.length > 0 && <div className="flex flex-wrap gap-2">
          {fileAtts.map(att => <div key={att.id}>
              <FileText size={14} color={theme.textMuted} strokeWidth={1.8} />
              <span className={"  text-foreground"}>
                {att.name}
              </span>
              {att.size != null && <span className={"  text-text-secondary"}>
                  {att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)}MB` : att.size > 1024 ? `${(att.size / 1024).toFixed(0)}KB` : `${att.size}B`}
                </span>}
              <button onClick={() => onRemove(att.id)} className="inline-flex items-center" role="button" aria-label={`Remove ${att.name}`}>
                <X size={12} color={theme.textMuted} strokeWidth={2} />
              </button>
            </div>)}
        </div>}
    </div>;
}
const styles = {
  container: {
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 8
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  imageWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 0.633,
    overflow: 'visible'
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)'
  },
  removeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileRow: {
    maxHeight: 48
  },
  fileContent: {
    gap: 6,
    paddingBottom: 6
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 6,
    paddingRight: 4,
    borderRadius: 8,
    borderWidth: 0.633
  },
  name: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    maxWidth: 120
  },
  size: {
    fontSize: 11,
    fontFamily: Fonts.sans
  },
  remove: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  }
} as const;
