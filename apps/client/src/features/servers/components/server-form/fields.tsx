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
  autoFocus
}: ServerFormFieldsProps) {
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const inputBg = isDark ? '#2a2a2a' : '#F6F6F6';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';
  return <div className={""}>
      <div className={""}>
        <span className={"" + " " + ""}>Name</span>
        <input className={"" + " " + ""} value={name} onChangeText={setName} placeholder="My Server" placeholderTextColor={isDark ? '#666' : '#bbb'} autoFocus={autoFocus} />
      </div>
      <div className={""}>
        <span className={"" + " " + ""}>Address</span>
        <input className={"" + " " + ""} value={address} onChangeText={setAddress} placeholder="http://192.168.1.100:10088" placeholderTextColor={isDark ? '#666' : '#bbb'} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      </div>
    </div>;
}
