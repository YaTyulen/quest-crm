export interface IRecord {
    name: string,    // имя клиента
    phone: string,   // телефон
    quest: string,   // посещённый квест
    data: number,    // дата посещения
    count: number,   // количество игроков в команде
    piece: number,   // стоимость игры
    isCash: boolean, // оплата наличными?
    note: string,    // комментарий
}