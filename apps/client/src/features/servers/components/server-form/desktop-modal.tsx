import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ServerFormFields } from './fields';
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
      <button className={" "} onClick={loading ? undefined : onClose}>
        <button className={" "} onClick={() => {}}>
          <div className={"block"}>
            <span className={" "}>
              {initial ? 'Edit Server' : 'Add Server'}
            </span>
            <button onClick={onClose} className={"block"} disabled={loading}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </button>
          </div>
          <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} autoFocus />
          {error && <span className={" "}>
              {error}
            </span>}
          <div className={"block"}>
            <button onClick={onClose} className={" "} disabled={loading}>
              <span className={" "}>Cancel</span>
            </button>
            <button onClick={() => {
            if (canSave) onSave({
              name: name.trim(),
              address: address.trim()
            });
          }} className={"  opacity-[0.4]"} disabled={!canSave}>
              {loading ? <span size="small" color="#fff" /> : <span className={"  text-[#fff]"}>
                  {initial ? 'Save' : 'Add & Connect'}
                </span>}
            </button>
          </div>
        </button>
      </button>
    </div>;
}
