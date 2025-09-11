import "./Select.scss";

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Select = ({ label, value, options, onChange }: SelectProps) => {
  return (
    <div className="select-input__container">
      <select className="select-input__input" name={label} onChange={onChange}>
        {options.map((option) => (
          <option value={option}>{option}</option>
        ))}
      </select>
      {/* <input
        name={label}
        className="select-input__input"
        type="text"
        value={value}
        placeholder=""
        onChange={onChange}
      /> */}
      <label className="select-input__label">{label}</label>
    </div>
  );
};
