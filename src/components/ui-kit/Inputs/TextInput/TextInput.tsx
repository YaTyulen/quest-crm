import './TextInput.scss'

interface TextInputProps {
    label: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const TextInput = ({label, value, onChange}: TextInputProps) => {

  return (
    <div className="text-input__container">
        <input name={label} className="text-input__input" type="text" value={value} placeholder='' onChange={onChange}/>
        <label className="text-input__label">{label}</label>
    </div>
  )
}