import { useNavigate } from 'react-router-dom';
import { Field } from '../../components/Field/Field';
import { Button } from '../../components/ui-kit';
import type { IField } from '../../types/Field';
import { BASE_PATH, clientFields } from '.././../constants';

import './FormPage.scss';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAppSelector } from '../../hooks/redux';
import type { IRecord } from '../../types/record';
import { recordClientSlice } from '../../store/slices';
import { useDispatch } from 'react-redux';

/**
 * Компонент для создания записи в базе данных.
 *
 * Отображает форму с полями для ввода информации о записи.
 * Создает запись в базе данных и переходит на страницу /clients.
 */
const FormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { recordClient } = useAppSelector((state) => state.recordClient); // Новая запись, еще не добавленная в базу
  const { clearRecordClient } = recordClientSlice.actions;

  /**
   * Создает форму с полями для ввода информации о клиенте.
   * @returns {JSX.Element[]} - элемент JSX, представляющий форму.
   */
  const buildForm = () => {
    return clientFields.map((field: IField) => <Field fieldInfo={field} />);
  };

  /**
   * Создает запись в базе данных и переходит на страницу /clients
   * @param {IRecord} record - объект с информацией о записи
   */
  const createRecord = async (record: IRecord) => {
    navigate(`/${BASE_PATH}/clients`);
    await addDoc(collection(db, 'clients'), record);

    dispatch(clearRecordClient()) // очищаем хранилище после выхода
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
