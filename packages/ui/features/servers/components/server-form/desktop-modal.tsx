import { useEffect, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Spinner, Text, View } from 'tamagui';
import { X } from 'lucide-react-native';

import { ServerFormFields } from './fields';
import { formStyles } from './styles';
import type { ServerFormProps } from './types';

export function ServerFormDesktopModal({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error,
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[formStyles.overlay, { backgroundColor: overlayBg }]}
        onPress={loading ? undefined : onClose}
      >
        <Pressable
          style={[formStyles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => {}}
        >
          <View style={formStyles.header}>
            <Text style={[formStyles.title, { color: textPrimary }]}>
              {initial ? 'Edit Server' : 'Add Server'}
            </Text>
            <Pressable onPress={onClose} style={formStyles.closeBtn} disabled={loading}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </Pressable>
          </View>
          <ServerFormFields
            name={name}
            setName={setName}
            address={address}
            setAddress={setAddress}
            isDark={isDark}
            autoFocus
          />
          {error && (
            <Text style={[formStyles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>
              {error}
            </Text>
          )}
          <View style={formStyles.actions}>
            <Pressable
              onPress={onClose}
              style={[formStyles.btn, { borderColor }]}
              disabled={loading}
            >
              <Text style={[formStyles.btnText, { color: textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (canSave) onSave({ name: name.trim(), address: address.trim() });
              }}
              style={[formStyles.btn, formStyles.btnPrimary, !canSave && { opacity: 0.4 }]}
              disabled={!canSave}
            >
              {loading ? (
                <Spinner size="small" color="#fff" />
              ) : (
                <Text style={[formStyles.btnText, { color: '#fff' }]}>
                  {initial ? 'Save' : 'Add & Connect'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
