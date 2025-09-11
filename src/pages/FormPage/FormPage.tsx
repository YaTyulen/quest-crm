import { useNavigate } from 'react-router-dom';
import { Field } from '../../components/Field/Field';
import { Button } from '../../components/ui-kit';
import type { IField } from '../../types/Field';
import { clientFields } from '.././../constants';

import './FormPage.scss';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAppSelector } from '../../hooks/redux';
import type { IRecord } from '../../types/record';

const FormPage = () => {
  const navigate = useNavigate();

  const { recordClient } = useAppSelector((state) => state.recordClient);

  const buildForm = () => {
    return clientFields.map((field: IField) => <Field fieldInfo={field} />);
  };

  const createRecord = async (record: IRecord) => {
    navigate('/clients');
    await addDoc(collection(db, 'clients'), record);
  };

  return (
    <div className='form'>
      <h2>Создание записи</h2>
      <div className='form__container'>{buildForm()}</div>
      <Button onClick={() => createRecord(recordClient)}>Создать</Button>
    </div>
  );
};

export default FormPage;
