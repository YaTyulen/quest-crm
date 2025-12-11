// components/ScheduleGrid/ScheduleCell.tsx
import React from 'react';
import './ScheduleCell.css';
import type { AvailabilityInfo } from '../../types/schedule';

interface ScheduleCellProps {
  date?: string;
  time: string;
  availableUsers: AvailabilityInfo[];
  onClick: () => void;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  time,
  availableUsers,
  onClick
}) => {
  const availableCount = availableUsers.length;
  
  return (
    <div 
      className={`schedule-cell ${availableCount > 0 ? 'has-available' : ''}`}
      onClick={onClick}
    >
      <div className="cell-time">{time}</div>
      <div className="cell-availability">
        {availableCount > 0 ? (
          <span className="available-count">
            {availableCount} сотрудник{availableCount === 1 ? '' : availableCount < 5 ? 'а' : 'ов'}
          </span>
        ) : (
          <span className="no-available">Нет сотрудников</span>
        )}
      </div>
    </div>
  );
};