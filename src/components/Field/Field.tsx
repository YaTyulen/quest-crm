import { useState } from 'react';
import type { IField } from '../../types/Field';
import {
  Checkbox,
  DateTimeInput,
  NumberInput,
  Select,
  TextInput,
} from '../ui-kit';

import './Field.scss';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { recordClientSlice } from '../../store/slices';

interface FieldProps {
  fieldInfo: IField;
}

/**
 * Компонент для отображения поля формы.
 *
 * @param {FieldProps} props - объект с параметрами компонента.
 * @param {IField} props.fieldInfo - объект с информацией о поле.
 *
 * @returns {JSX.Element} - отображаемый компонент.
 */
export const Field = ({ fieldInfo }: FieldProps) => {
  const [value, setValue] = useState(fieldInfo.value);

  const dispatch = useAppDispatch();
  const { setRecordClient } = recordClientSlice.actions;
  const { recordClient } = useAppSelector((state) => state.recordClient);

  /**
   * Обработчик события изменения значения текстового поля.
   * @param {React.ChangeEvent<HTMLInputElement>} event - событие изменения значения текстового поля.
   */
  const handleChangeTextInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let newRecordClient = { ...recordClient };
    setValue(((newRecordClient as any)[fieldInfo.field] = event.target.value));
    dispatch(setRecordClient(newRecordClient));
  };

  /**
   * Обработчик события изменения значения select-элемента.
   * @param {React.ChangeEvent<HTMLInputElement>} event - событие изменения значения select-элемента.
   */
  const handlerChangeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newRecordClient = { ...recordClient };
    setValue(((newRecordClient as any)[fieldInfo.field] = event.target.value));
    dispatch(setRecordClient(newRecordClient));
  };

  /**
   * Обработчик события изменения значения поля даты.
   * @param {number | null} value - новое значение поля даты.
   */
  const handlerChangeData = (value: number | null) => {
    let newRecordClient = { ...recordClient };
    if (value !== null) {
      setValue(((newRecordClient as any)[fieldInfo.field] = String(value)));
    } else {
      setValue(((newRecordClient as any)[fieldInfo.field] = ''));
    }
    dispatch(setRecordClient(newRecordClient));
  };

  /**
   * Обработчик события изменения значения чекбокса.
   * @param {React.ChangeEvent<HTMLInputElement>} event - событие изменения значения чекбокса.
   */
  const handleChangeCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newRecordClient = { ...recordClient };
    setValue(
      ((newRecordClient as any)[fieldInfo.field] =
        event.target.checked.toString())
    );
    dispatch(setRecordClient(newRecordClient));
  };

  const buildField = (field: IField) => {
    switch (field.type) {
      case 'text':
        return (
          <TextInput
            label={field.field_ru}
            value={value}
            onChange={handleChangeTextInput}
          />
        );
      case 'number':
        return (
          <NumberInput
            label={field.field_ru}
            value={value}
            onChange={handleChangeTextInput}
          />
        );
      case 'boolean':
        return (
          <Checkbox
            label={field.field_ru}
            checked={value === 'true'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChangeCheckbox(e)
            }
          />
        );
      case 'select':
        return (
          <Select
            label={field.field_ru}
            value={value}
            options={fieldInfo.options ?? []}
            onChange={handlerChangeSelect}
          />
        );
      case 'data':
        return (
          <DateTimeInput
            label={field.field_ru}
            value={Number(value)}
            onChange={(value: number | null) => handlerChangeData(value)}
          />
        );
      default:
        return (
          <TextInput
            label={field.field_ru}
            value={value}
            onChange={handleChangeTextInput}
          />
        );
    }
  };

  return <div className='field'>{buildField(fieldInfo)}</div>;
};
