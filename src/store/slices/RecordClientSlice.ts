import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IRecord } from '../../types/record';

interface RecordClientState {
  recordClient: IRecord; // объект новой записи
}

const initialState: RecordClientState = {
    recordClient: {
        name: '',    
        phone: '',  
        quest: '',   
        data: Date.now(),    
        count: 0,  
        piece: 0,   
        isCash: false, 
        note: '',   
    }
};

export const recordClientSlice = createSlice({
  name: 'recordClient',
  initialState,
  reducers: {
    setRecordClient(state, action: PayloadAction<IRecord>) {
      state.recordClient = action.payload;
    },
  },
});



export default recordClientSlice.reducer;
