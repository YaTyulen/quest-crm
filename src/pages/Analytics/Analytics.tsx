import { useMemo, useState } from 'react'
import './Analytics.scss'
import { useClientsData } from '../../hooks/useClientsData';
import { fillInObjectAgregaror, fillInObjectCash, fillInObjectDate, fillInObjectIncome, fillInObjectPrice, fillInObjectProfit, fillInObjectTime } from '../../utils/buildDataForCharts';
import Chart from '../../components/ui-kit/Chart/Chart';
import PieChart from '../../components/ui-kit/PieChart/PieChart';
import PeriodFilter from '../../components/ui-kit/PeriodFilter/PeriodFilter';
import type { DateRange } from '../../types/dateRange';

type quest = "Теле-ужас" | "Хозяйка"
type typeChart = "По месяцам" | "По времени" | "Способ оплаты" |  "По стоимости" | "Выручка по месяцам" | "Прибыль по месяцам" | "По агрегаторам" | undefined

const Analytics = () => {
  const [activeQuest, setActiveQuest] = useState<quest>("Теле-ужас");
  const [activeType, setActiveType] = useState<typeChart>();
  const { completed: clients, loading } = useClientsData();
  const [range, setRange] = useState<DateRange | null>(null);

  const filteredData = useMemo(() => {
    return clients.filter(client => {
      const matchesQuest = client.quest === activeQuest;
      const matchesDate = range 
        ? new Date(client.data) >= new Date(range.from) && new Date(client.data) <= new Date(range.to)
        : true;     
      return matchesQuest && matchesDate;
    });
  }, [clients, activeQuest, range]);



  const selectTab = (quest: quest) => {
    setActiveQuest(quest)
  }

  const selectTabType = (type: typeChart) => {
    setActiveType(type)
  }

  const getChart = () => {
    switch (activeType) {
      case 'По месяцам':
        const data = fillInObjectDate(filteredData);       
        return <Chart data={data} maxValue={Object.values(data).reduce((max, curr) => (curr > max ? curr : max))}/>;
      case 'По времени':
        let dataTime = fillInObjectTime(filteredData)
        return <Chart data={dataTime} maxValue={Object.values(dataTime).reduce((max, curr) => (curr > max ? curr : max))}/>
      case 'Способ оплаты':
        let dataCash = fillInObjectCash(filteredData)
        return <PieChart data={dataCash}  />
      case 'По стоимости':
        let dataPrice = fillInObjectPrice(filteredData)
        return <PieChart data={dataPrice}  />
      case 'Выручка по месяцам':
        let dataIncome = fillInObjectIncome(filteredData)
        return <Chart data={dataIncome} maxValue={Object.values(dataIncome).reduce((max, curr) => (curr > max ? curr : max))}/>
      case 'Прибыль по месяцам':
        let dataProfit = fillInObjectProfit(filteredData)
        return <Chart data={dataProfit} maxValue={Object.values(dataProfit).reduce((max, curr) => (curr > max ? curr : max))}/>
      case 'По агрегаторам':
        let dataAgregator = fillInObjectAgregaror(filteredData)
        return <PieChart data={dataAgregator}  />
      default: 
        return 'Не выбрано' 
    }
  }


  return (
    <div className="analytics">
      <div className="analytics__quests">
        <div>Квест:</div>
        <ul className='quest__list'>
          <button className={activeQuest === 'Теле-ужас' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTab("Теле-ужас")}>Теле-ужас</button>
          <button className={activeQuest === 'Хозяйка' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTab("Хозяйка")}>Хозяйка</button>
        </ul>
      </div>

      <div className="analytics__quests">
        <div>Период:</div>
        <PeriodFilter onChange={setRange} />
      </div>

      <div className="analytics__quests">
        <div>График:</div>
        <ul className='quest__list'>
          <button className={activeType === 'По месяцам' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("По месяцам")}>По месяцам</button>
          <button className={activeType === 'По времени' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("По времени")}>По времени</button>
          <button className={activeType === 'Способ оплаты' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("Способ оплаты")}>Способ оплаты</button>
          <button className={activeType === 'По стоимости' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("По стоимости")}>По стоимости</button>
          <button className={activeType === 'Выручка по месяцам' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("Выручка по месяцам")}>Выручка по месяцам</button>
          <button className={activeType === 'Прибыль по месяцам' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("Прибыль по месяцам")}>Прибыль по месяцам</button>
          <button className={activeType === 'По агрегаторам' ? "quest__item quest__item--active" : "quest__item" } onClick={() => selectTabType("По агрегаторам")}>По агрегаторам</button>
        </ul>
      </div>
      

      {loading ? 'Загрузка' : getChart() }


    </div>
  )
}

export default Analytics