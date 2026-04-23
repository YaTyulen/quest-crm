import './Select.scss';

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = ({ label, value, options, onChange }: SelectProps) => {
  return (
    <div className='select-input__container'>
      <select
        className='select-input__input'
        name={label}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <label className='select-input__label'>{label}</label>
    </div>
  );
};
