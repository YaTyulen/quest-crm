import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IRecord } from '../../types/record';

const defaultRecordClient: IRecord = {
    name: '',
    phone: '',
    quest: 'Теле-ужас',
    data: Date.now(),
    count: 0,
    piece: 0,
    isCash: false,
    note: '',
    admin: 'Не указан',
    actor: 'Не указан',
    time: '10:00',
  }

interface RecordClientState {
  recordClient: IRecord; // объект новой записи
}

const initialState: RecordClientState = {
    recordClient: defaultRecordClient
};

export const recordClientSlice = createSlice({
  name: 'recordClient',
  initialState,
  reducers: {
    setRecordClient(state, action: PayloadAction<IRecord>) {
      state.recordClient = action.payload;
    },
    clearRecordClient(state){
      state.recordClient = defaultRecordClient;
    }
  },
});



export default recordClientSlice.reducer;
