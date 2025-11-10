import DateProvider from "./DateProvider";

/**
 * Форматирует timestamp в строку в указанном формате.
 *
 * @param {number} timestamp - timestamp в секундах
 * @param {string} [format='DD.MM.YYYY hh:mm'] - формат выводимой строки
 * @returns {string} отформатированная строка даты
 * @description
 * Функция берет timestamp в секундах и возвращает строку, отформатированную в соответствии с указанным форматом.
 * Если формат не указан, функция будет возвращать строку в формате 'YYYY-MM-DD'.
 * Функция поддерживает три формата: 'YYYY-MM-DD', 'DD.MM.YYYY' и 'timestampToDate'. Последний является типом Date в строковом представлении
 */
export function formatDate(timestamp: number, format = 'DD.MM.YYYY hh:mm') {
  
    if (!timestamp) {
      return undefined;
    }
  
    let date = DateProvider.getDate(timestamp);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    let hours = String(date.getHours()).padStart(2, '0');
    let minuties = String(date.getMinutes()).padStart(2, '0');
  
    let formattedDate = '';
    switch (format) {
      case 'DD.MM.YYYY hh:mm':
        formattedDate = `${day}.${month}.${year} ${hours}:${minuties}`;
        break;
      case 'DD.MM.YYYY':
        formattedDate = `${day}.${month}.${year}`;
        break;
      
      default:
        formattedDate = `${year}-${month}-${day}`;
        break;
    }
  
    return formattedDate;
  }