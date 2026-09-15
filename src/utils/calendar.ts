export const Months: {[key: number]: string} = {
    1: "Январь",
    2: "Февраль",
    3: "Март",
    4: "Апрель",
    5: "Май",
    6: "Июнь",
    7: "Июль",
    8: "Август",
    9: "Сентябрь",
    10: "Октябрь",
    11: "Ноябрь",
    12: "Декабрь",
}

interface CalendarGame {
    name: string;
    phone: string;
    quest: string;
    data: number | string;
    note?: string;
    agregator: string;
}

const GAME_DURATION_MS = 2 * 60 * 60 * 1000;

const toGoogleCalendarDate = (date: Date): string =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const openGameInGoogleCalendar = (game: CalendarGame): void => {
    const start = new Date(Number(game.data));

    if (Number.isNaN(start.getTime())) {
        console.error('Не удалось добавить игру в календарь: некорректная дата');
        return;
    }

    const end = new Date(start.getTime() + GAME_DURATION_MS);
    const eventTitle = [
        game.name,
        game.phone,
        game.note?.trim() ? `(${game.note.trim()})` : '',
        game.agregator,
    ].filter(Boolean).join(' ');
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
        details: `Игра: ${game.quest}`,
    });

    window.open(
        `https://calendar.google.com/calendar/render?${params.toString()}`,
        '_blank',
        'noopener,noreferrer',
    );
};
