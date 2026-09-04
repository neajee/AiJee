import { Input, Text, View } from 'tamagui';
import { formStyles } from './styles';

interface ServerFormFieldsProps {
  name: string;
  setName: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  isDark: boolean;
  autoFocus?: boolean;
}

export function ServerFormFields({
  name,
  setName,
  address,
  setAddress,
  isDark,
  autoFocus,
}: ServerFormFieldsProps) {
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const inputBg = isDark ? '#2a2a2a' : '#F6F6F6';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';

  return (
    <View style={formStyles.fields}>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Name</Text>
        <Input
          style={[formStyles.input, { backgroundColor: inputBg, color: textPrimary, borderColor }]}
          value={name}
          onChangeText={setName}
          placeholder="My Server"
          placeholderTextColor={isDark ? '#666' : '#bbb'}
          autoFocus={autoFocus}
        />
      </View>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Address</Text>
        <Input
          style={[formStyles.input, { backgroundColor: inputBg, color: textPrimary, borderColor }]}
          value={address}
          onChangeText={setAddress}
          placeholder="http://192.168.1.100:10088"
          placeholderTextColor={isDark ? '#666' : '#bbb'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>
    </View>
  );
}
