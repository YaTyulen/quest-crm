export default class DateProvider {
    /**
     * Преобразование объекта Date в соответствующий timestamp (UTC 0) без учета часового пояса пользователя
     * @param {Date} date - дата
     * @returns {number} дата в формате timestamp (UTC 0)
     */
    static getTimestamp(date: Date) {
      return date
        ? Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
          ) / 1000
        : null;
    }
  
    /**
     * Перевод timestamp в Date без учета часового пояса пользователя
     * @param {number} timestamp - дата в формате timestamp (UTC 0)
     * @returns {Date} дата (UTC 0)
     */
    static getDate(timestamp: number) {
      return new Date(timestamp * 1000);
    }
}
  