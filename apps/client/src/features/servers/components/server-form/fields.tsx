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
  return <div className="flex flex-col">
      <div className="flex flex-col">
        <span>Name</span>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="My Server" autoFocus={autoFocus} />
      </div>
      <div className="flex flex-col">
        <span>Address</span>
        <input value={address} onChange={event => setAddress(event.target.value)} placeholder="http://192.168.1.100:10088" />
      </div>
    </div>;
}
