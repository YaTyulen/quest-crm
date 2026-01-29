import type { IField } from "./types/Field";

// Константа полей формы для записи клиентов
export const clientFields: IField[] = [
    {
        id: 1,
        field: 'name',
        field_ru: 'Имя',
        type: 'text',
        value: '',
    },
    {
        id: 2,
        field: 'phone',
        field_ru: 'Телефон',
        type: 'number',
        value: '',
    },
    {
        id: 3,
        field: 'quest',
        field_ru: 'Квест',
        type: 'select',
        options: ['Теле-ужас', 'Хозяйка'],
        value: '',
    },
    {
        id: 4,
        field: 'data',
        field_ru: 'Дата',
        type: 'data',
        value: '',
    },
    {
        id: 5,
        field: 'count',
        field_ru: 'Количество игроков',
        type: 'number',
        value: '',
    },
    {
        id: 6,
        field: 'piece',
        field_ru: 'Стоимость',
        type: 'number',
        value: '',
    },
    {
        id: 7,
        field: 'isCash',
        field_ru: 'Оплата наличными?',
        type: 'boolean',
        value: 'false',
    },
    {
        id: 8,
        field: 'agregator',
        field_ru: 'Агрегатор',
        type: 'select',
        options: ['Мир Квестов', 'Топ Квестов', 'Квест Хантер', 'Реклама', 'Сарафанка'],
        value: '',
    },
    {
        id: 9,
        field: 'admin',
        field_ru: 'Кто админил?',
        type: 'text',
        value: '',
    },
    {
        id: 10,
        field: 'actor',
        field_ru: 'Кто актерил?',
        type: 'text',
        value: '',
    },
    {
        id: 11,
        field: 'note',
        field_ru: 'Комментарий',
        type: 'text',
        value: '',
    }
]


// константа сетки расписания:
export const TEMPORARY_GRID: {[key: string]: number} = {
    "10:00": 0,
    "12:00": 0,
    "14:00": 0,
    "16:00": 0,
    "18:00": 0,
    "20:00": 0,
    "22:00": 0,
}