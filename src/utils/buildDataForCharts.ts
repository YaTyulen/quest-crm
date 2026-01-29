import { TEMPORARY_GRID } from "../constants";
import type { Client } from "../types/client";
import { Months } from "./calendar";

/* Функция построения структуры объекта для графика месяц - кол-во игр */
const buildObjectDate = () => {
    const startDate = new Date(1761930000 * 1000);
    const endDate = new Date();

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const months: {[key: string]: number} = {};
    
    while (current <= endDate) {
        const monthKey = `${Months[current.getMonth() + 1]} ${current.getFullYear()}`;
        months[monthKey] = 0;
        current.setMonth(current.getMonth() + 1)
    }

    return months
}
    

/* Заполняем объект данными для графика месяц - кол-во игр */
export const fillInObjectDate = (clients: Client[]) => {
    let data = buildObjectDate()
    for(let client of clients){
        let current = new Date(Number(client.data));
        
        if(data[`${Months[current.getMonth() + 1]} ${current.getFullYear()}`] !== undefined ){              
            data[`${Months[current.getMonth() + 1]} ${current.getFullYear()}`] += 1;
        } 
    }

    return data
}

/* Заполняем объект данными для графика время - кол-во игр */
export const fillInObjectTime = (clients: Client[]) => {
    let data = structuredClone(TEMPORARY_GRID)
    for(let client of clients){
        let current = new Date(Number(client.data)).getHours().toString() + ':00';
        if(data[current] !== undefined){
        data[current] += 1;
        }
    }

    return data
}

/* Заполняем объект данными для графика кол-во игр оплаченных наличкой и по QR */
export const fillInObjectCash = (clients: Client[]) => {
    let data = { 'Наличные': 0, "QR-код": 0}
    for(let client of clients){
        if(client.isCash){
            data["Наличные"] += 1;
        }
        else {
            data["QR-код"] += 1;
        }
    }

    return data
}

/* Заполняем объект данными для графика кол-во игр по разной стоимости */
export const fillInObjectPrice = (clients: Client[]) => {
    const data: Record<string, number> = {};
    for(let client of clients) {
        const key = String(client.piece);
        data[key] = (data[key] ?? 0) + 1;
    }
    return data
}
