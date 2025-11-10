import { useState } from 'react'
import './PasswordInput.scss'

import Eye from '../../../../assets/eye.svg'
import LowEye from '../../../../assets/low-eye.svg'

interface PasswordInputProps {
    label: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const PasswordInput = ({label, value, onChange}: PasswordInputProps) => {
    const [type, setType] = useState('password')

    console.log(typeof Eye);
    
  return (
    <div className="password-input__container">
        <div className='password-input__field'>
            <input name={label} className="password-input__input" type={type} value={value} placeholder='' onChange={onChange}/>
            <label className="password-input__label">{label}</label>
        </div>
        
        <button className='password-input__button' type='button' onMouseDown={() => setType('text')} onMouseUp={() => setType('password')} onMouseLeave={() => setType('password')} onTouchStart={() => setType('text')} onTouchEnd={() => setType('password')} onTouchCancel={() => setType('password')}>
            {type=== 'password' ? <Eye/> : <LowEye/>}
        </button>
    </div>
  )
}
