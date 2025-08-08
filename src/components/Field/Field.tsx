import type {IField} from '../../types/Field'
import { TextInput } from '../ui-kit'

import './Field.scss'

interface FieldProps {
  fieldInfo: IField
}

export const Field = ({fieldInfo}:FieldProps) => {

  const handleChangeTextInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    //s
  }

  const buildField = (field: IField) => {
    switch(field.type) {
      case 'text':
        return <TextInput label={field.field_ru} value={field.value} onChange={handleChangeTextInput}/>
      case 'number':
        return <TextInput label={field.field_ru} value={field.value} onChange={handleChangeTextInput}/>
      case 'boolean':
        return <TextInput label={field.field_ru} value={field.value} onChange={handleChangeTextInput}/>
      case 'select':
        return <TextInput label={field.field_ru} value={field.value} onChange={handleChangeTextInput}/>
      default:
        return <TextInput label={field.field_ru} value={field.value} onChange={handleChangeTextInput}/>
    }
  }


  return (
    <div className='field'>
      {buildField(fieldInfo)}
    </div>
  )
}
