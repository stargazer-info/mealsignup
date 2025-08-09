import React from 'react';
import type { DailyData } from '../types/DailyData';

interface MonthlySummaryProps {
  monthlySummary: {
    year: number;
    month: number;
    dailyData: DailyData[];
  };
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ monthlySummary }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 w-full">
      <h2 className="text-lg font-semibold text-text mb-4">
        {monthlySummary.year}年 {monthlySummary.month}月
      </h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1 text-left">日付</th>
            <th className="border px-2 py-1 text-center">朝食</th>
            <th className="border px-2 py-1 text-center">昼食</th>
            <th className="border px-2 py-1 text-center">夕食</th>
          </tr>
        </thead>
        <tbody>
          {monthlySummary.dailyData.map((row) => (
            <tr key={row.day}>
              <td className="border px-2 py-1">{row.day}日</td>
              <td className="border px-2 py-1 text-center">
                <span className={`text-2xl ${row.breakfast ? 'text-green-600' : 'text-gray-300'}`}>
                  ✓
                </span>
              </td>
              <td className="border px-2 py-1 text-center">
                <span className={`text-2xl ${row.lunch ? 'text-green-600' : 'text-gray-300'}`}>
                  ✓
                </span>
              </td>
              <td className="border px-2 py-1 text-center">
                <span className={`text-2xl ${row.dinner ? 'text-green-600' : 'text-gray-300'}`}>
                  ✓
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
