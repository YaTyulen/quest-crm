import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Field } from '../../components/Field/Field';
import { Button, Select } from '../../components/ui-kit';
import type { IField } from '../../types/Field';
import { BASE_PATH, clientFields } from '../../constants';
import { db } from '../../firebase';
import { useAppSelector } from '../../hooks/redux';
import type { IRecord } from '../../types/record';
import { recordClientSlice } from '../../store/slices';
import { useDispatch } from 'react-redux';
import { getAllUsers } from '../../utils/userUtils';
import type { UserProfile } from '../../types/roles';
import { timeSlots } from '../../utils/scheduleUtils';
import '../FormPage/FormPage.scss';

const UPCOMING_HIDDEN = ['count', 'piece', 'isCash'];

const EditPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const { recordClient } = useAppSelector((state) => state.recordClient);
  const { setRecordClient, clearRecordClient } = recordClientSlice.actions;

  const [loadedFields, setLoadedFields] = useState<IField[] | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    getAllUsers().then(setUsers);

    if (!id) return;
    getDoc(doc(db, 'clients', id)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();

      dispatch(setRecordClient({
        name: d.name ?? '',
        phone: d.phone ?? '',
        quest: d.quest ?? 'Теле-ужас',
        data: Number(d.data),
        count: Number(d.count) || 0,
        piece: Number(d.piece) || 0,
        isCash: d.isCash === 'true' || d.isCash === true,
        note: d.note ?? '',
        admin: d.admin ?? 'Не указан',
        actor: d.actor ?? 'Не указан',
        time: d.time ?? '10:00',
      }));

      setLoadedFields(clientFields.map(f => {
        let value: string;
        switch (f.field) {
          case 'data':   value = String(d.data ?? ''); break;
          case 'isCash': value = String(d.isCash === 'true' || d.isCash === true); break;
          case 'count':  value = String(d.count ?? ''); break;
          case 'piece':  value = String(d.piece ?? ''); break;
          default:       value = String(d[f.field] ?? f.value);
        }
        return { ...f, value };
      }));
    });
  }, [id]);

  const isUpcoming = recordClient.data > Date.now();

  const operators = ['Не указан', ...users
    .filter(u => u.role === 'operator' || u.role === 'admin')
    .map(u => u.displayName)];

  const actors = ['Не указан', ...users
    .filter(u => u.role === 'actor' || u.role === 'admin')
    .map(u => u.displayName)];

  const set = (patch: Partial<IRecord>) => {
    dispatch(setRecordClient({ ...recordClient, ...patch }));
  };

  const buildForm = () => {
    const fields = isUpcoming
      ? (loadedFields!).filter(f => !UPCOMING_HIDDEN.includes(f.field))
      : loadedFields!;
    return fields.map(f => <Field key={f.id} fieldInfo={f} />);
  };

  const saveRecord = async () => {
    await updateDoc(doc(db, 'clients', id!), recordClient as Record<string, unknown>);
    dispatch(clearRecordClient());
    navigate(`/${BASE_PATH}/clients`);
  };

  const cancel = () => {
    dispatch(clearRecordClient());
    navigate(`/${BASE_PATH}/clients`);
  };

  if (!loadedFields) {
    return <div className='form'><p>Загрузка...</p></div>;
  }

  return (
    <div className='form'>
      <h2>Редактирование записи</h2>
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
      <div className='form__actions'>
        <Button onClick={saveRecord}>Сохранить</Button>
        <Button color='light' onClick={cancel}>Отмена</Button>
      </div>
    </div>
  );
};

export default EditPage;
