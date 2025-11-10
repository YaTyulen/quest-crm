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
        options: ['quest1', 'quest2', 'quest3'],
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
        field: 'note',
        field_ru: 'Комментарий',
        type: 'text',
        value: '',
    }
]