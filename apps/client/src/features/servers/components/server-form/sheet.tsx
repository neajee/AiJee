import { useEffect, useState } from 'react';
import { ServerFormFields } from './fields';
const SHEET_HEIGHT = 520;
import type { ServerFormProps } from './component-types';
import { AppModal } from '@/components/ui/app-modal';
export function ServerFormSheet({
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
  const canSave = Boolean(name.trim() && address.trim() && !loading);
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setAddress(initial?.address ?? '');
    }
  }, [initial, visible]);
  return <AppModal visible={visible} onClose={loading ? () => undefined : onClose}>
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">{initial ? 'Edit Server' : 'Add Server'}</h2>
        <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={() => canSave && onSave({ name: name.trim(), address: address.trim() })} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" disabled={!canSave}>
          {loading ? <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : initial ? 'Save & Connect' : 'Add & Connect'}
        </button>
      </div>
    </AppModal>;
}
