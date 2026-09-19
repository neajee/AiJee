import { toTailwind } from "@/styles/to-tailwind";
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ServerFormFields } from './fields';
import { formStyles } from './style-tokens';
import type { ServerFormProps } from './component-types';
export function ServerFormDesktopModal({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error
}: ServerFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setAddress(initial?.address ?? '');
    }
  }, [initial, visible]);
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const cardBg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';
  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
  const canSave = Boolean(name.trim() && address.trim() && !loading);
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={toTailwind([formStyles.overlay, {
      backgroundColor: overlayBg
    }])} onClick={loading ? undefined : onClose}>
        <button className={toTailwind([formStyles.card, {
        backgroundColor: cardBg,
        borderColor
      }])} onClick={() => {}}>
          <div className={toTailwind(formStyles.header)}>
            <span className={toTailwind([formStyles.title, {
            color: textPrimary
          }])}>
              {initial ? 'Edit Server' : 'Add Server'}
            </span>
            <button onClick={onClose} className={toTailwind(formStyles.closeBtn)} disabled={loading}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </button>
          </div>
          <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} autoFocus />
          {error && <span className={toTailwind([formStyles.errorText, {
          color: isDark ? '#FF453A' : '#FF3B30'
        }])}>
              {error}
            </span>}
          <div className={toTailwind(formStyles.actions)}>
            <button onClick={onClose} className={toTailwind([formStyles.btn, {
            borderColor
          }])} disabled={loading}>
              <span className={toTailwind([formStyles.btnText, {
              color: textMuted
            }])}>Cancel</span>
            </button>
            <button onClick={() => {
            if (canSave) onSave({
              name: name.trim(),
              address: address.trim()
            });
          }} className={toTailwind([formStyles.btn, formStyles.btnPrimary, !canSave && {
            opacity: 0.4
          }])} disabled={!canSave}>
              {loading ? <span size="small" color="#fff" /> : <span className={toTailwind([formStyles.btnText, {
              color: '#fff'
            }])}>
                  {initial ? 'Save' : 'Add & Connect'}
                </span>}
            </button>
          </div>
        </button>
      </button>
    </div>;
}
