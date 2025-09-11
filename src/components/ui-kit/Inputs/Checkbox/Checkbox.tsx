import './Checkbox.scss';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

/**
 *
 * @param {bool} checked - текущее состояние чекбокса
 * @param {function} onChange - функция обработки изменения состояния чекбокса
 * @param {bool} disabled - флаг для отключения чекбокса (необязательный пропс)
 * @returns UI-компонент для чекбокса
 */
export function Checkbox(props: CheckboxProps) {
  const { label, checked, onChange, disabled = false } = props;
  return (
    <div className='checkbox__container'>
      <label className='checkbox__label'>{label}</label>
      <input
        type='checkbox'
        className='checkbox'
        defaultChecked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
