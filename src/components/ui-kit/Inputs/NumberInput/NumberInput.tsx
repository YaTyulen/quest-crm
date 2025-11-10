import "./NumberInput.scss";

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NumberInput = ({ label, value, onChange }: NumberInputProps) => {
  return (
    <div className="number-input__container">
      <input
        name={label}
        className="number-input__input"
        type="number"
        value={value}
        placeholder=""
        onChange={onChange}
      />
      <label className="number-input__label">{label}</label>
    </div>
  );
};
