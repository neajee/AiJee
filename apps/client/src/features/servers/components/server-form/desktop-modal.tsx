import { useEffect, useState } from 'react';
import { AppModal } from '@/components/ui';
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
  const canSave = Boolean(name.trim() && address.trim() && !loading);
  return <AppModal visible={visible} onClose={loading ? () => undefined : onClose} title={initial ? 'Edit Server' : 'Add Server'} showClose>
          <div className="flex flex-col gap-5">
            <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} autoFocus />
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="rounded-md px-3 py-2 text-sm hover:bg-hover disabled:opacity-50" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-content hover:opacity-90 disabled:opacity-40" onClick={() => {
            if (canSave) onSave({
              name: name.trim(),
              address: address.trim()
            });
          }} disabled={!canSave}>{loading ? 'Saving…' : initial ? 'Save' : 'Add & Connect'}</button>
            </div>
          </div>
    </AppModal>;
}
