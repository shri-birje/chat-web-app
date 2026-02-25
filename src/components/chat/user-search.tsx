type UserSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function UserSearch({ value, onChange }: UserSearchProps) {
  return (
    <input
      className="w-full rounded-md border px-3 py-2"
      placeholder="Search users"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
