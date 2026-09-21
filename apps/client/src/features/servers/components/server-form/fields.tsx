interface ServerFormFieldsProps {
  name: string;
  setName: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  autoFocus?: boolean;
}
export function ServerFormFields({
  name,
  setName,
  address,
  setAddress,
  autoFocus
}: ServerFormFieldsProps) {
  return <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-caption text-text-secondary">
        <span>Name</span>
        <input className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-body text-foreground outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/25" value={name} onChange={event => setName(event.target.value)} placeholder="My Server" autoFocus={autoFocus} />
      </label>
      <label className="flex flex-col gap-1.5 text-caption text-text-secondary">
        <span>Address</span>
        <input className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-body text-foreground outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/25" value={address} onChange={event => setAddress(event.target.value)} placeholder="http://192.168.1.100:10088" />
      </label>
    </div>;
}
