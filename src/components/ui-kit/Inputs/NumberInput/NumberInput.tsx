import './NumberInput.scss'

interface NumberInputProps {
    label: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const NumberInput = ({label, value, onChange}: NumberInputProps) => {

  return (
    <div className="text-input__container">
        <input name={label} className="text-input__input" type="number" value={value} placeholder='' onChange={onChange}/>
        <label className="text-input__label">{label}</label>
    </div>
  )
}