import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../../components/Field/Field';
import { Button, Select } from '../../components/ui-kit';
import type { IField } from '../../types/Field';
import { BASE_PATH, clientFields } from '.././../constants';
import './FormPage.scss';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAppSelector } from '../../hooks/redux';
import type { IRecord } from '../../types/record';
import { recordClientSlice } from '../../store/slices';
import { useDispatch } from 'react-redux';
import { getAllUsers } from '../../utils/userUtils';
import type { UserProfile } from '../../types/roles';
import { timeSlots } from '../../utils/scheduleUtils';

const UPCOMING_HIDDEN = ['count', 'piece', 'isCash'];

const FormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { recordClient } = useAppSelector((state) => state.recordClient);
  const { clearRecordClient, setRecordClient } = recordClientSlice.actions;

  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const isUpcoming = recordClient.data > Date.now();

  const operators = ['Не указан', ...users
    .filter(u => u.role === 'operator' || u.role === 'admin')
    .map(u => u.displayName)];

  const actors = ['Не указан', ...users
    .filter(u => u.role === 'actor')
    .map(u => u.displayName)];

  const buildForm = () => {
    const fields = isUpcoming
      ? clientFields.filter((f: IField) => !UPCOMING_HIDDEN.includes(f.field))
      : clientFields;
    return fields.map((field: IField) => <Field key={field.id} fieldInfo={field} />);
  };

  const set = (patch: Partial<IRecord>) => {
    dispatch(setRecordClient({ ...recordClient, ...patch }));
  };

  const createRecord = async (record: IRecord) => {
    navigate(`/${BASE_PATH}/clients`);
    await addDoc(collection(db, 'clients'), record);
    dispatch(clearRecordClient());
  };

  return (
    <div className='form'>
      <h2>Создание записи</h2>
      <div className='form__container'>
        {buildForm()}
        <Select
          label='Оператор'
          value={recordClient.admin ?? 'Не указан'}
          options={operators}
          onChange={e => set({ admin: e.target.value })}
        />
        <Select
          label='Актёр'
          value={recordClient.actor ?? 'Не указан'}
          options={actors}
          onChange={e => set({ actor: e.target.value })}
        />
      </div>
      <Button onClick={() => createRecord(recordClient)}>Создать</Button>
    </div>
  );
};

export default FormPage;
