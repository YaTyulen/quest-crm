import './Select.scss';

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = ({ label, value, options, onChange }: SelectProps) => {
  console.log(value);
  
  return (
    <div className='select-input__container'>
      <select className='select-input__input' name={label} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event)}>
        {options.map((option) => (
          <option value={option}>{option}</option>
        ))}
      </select>
      <label className='select-input__label'>{label}</label>
    </div>
  );
};
