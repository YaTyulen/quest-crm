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

export const Field = ({ fieldInfo }: FieldProps) => {
  const [value, setValue] = useState(fieldInfo.value);

  const dispatch = useAppDispatch();
  const { setRecordClient } = recordClientSlice.actions;
  const { recordClient } = useAppSelector((state) => state.recordClient);

  console.log(recordClient);
  console.log(fieldInfo.field);

  const handleChangeTextInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let newRecordClient = { ...recordClient };
    setValue(((newRecordClient as any)[fieldInfo.field] = event.target.value));
    dispatch(setRecordClient(newRecordClient));
  };
  const handlerChangeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handlerChangeSelect');
  };

  const handlerChangeData = (value: number | null) => {
    console.log('handlerChangeData', value);
    let newRecordClient = { ...recordClient };
    if (value !== null) {
      setValue(((newRecordClient as any)[fieldInfo.field] = String(value)));
    } else {
      setValue(((newRecordClient as any)[fieldInfo.field] = ''));
    }
    dispatch(setRecordClient(newRecordClient));
  };

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
