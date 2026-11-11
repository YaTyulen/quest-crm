import './TextInput.scss'

interface TextInputProps {
    type?: 'text' | 'email',
    label: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    autoComplete?: string
    required?: boolean
    minLength?: number
}

export const TextInput = ({label, value, onChange, autoComplete, type = 'text', required, minLength}: TextInputProps) => {

  return (
    <div className="text-input__container">
        <input name={label} className="text-input__input" type={type} value={value} placeholder='' onChange={onChange} autoComplete={autoComplete} required={required} minLength={minLength}/>
        <label className="text-input__label">{label}</label>
    </div>
  )
}
