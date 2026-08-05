export function AutomationToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 border-2 border-border bg-secondary-background p-3 shadow-shadow ${
        disabled ? "opacity-60" : "hover:bg-main/5"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 accent-main"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-black">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] font-bold text-foreground/65">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
