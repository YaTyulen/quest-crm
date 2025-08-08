import { Field } from '../../components/Field/Field';
import type { IField } from '../../types/Field';
import {clientFields} from '.././../constants';

import './FormPage.scss'

const FormPage = () => {

  const buildForm = () => {
    return clientFields.map((field: IField) => <Field fieldInfo={field}/>)
  }

  return (
    <div className="form">
      <form>
        {buildForm()}
      </form>
    </div>
  )
}

export default FormPage