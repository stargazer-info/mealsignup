import React from 'react';
import type { DailyData } from '../types/DailyData';

interface MonthlySummaryProps {
  monthlySummary: {
    year: number;
    month: number;
    dailyData: DailyData[];
  };
  onEdit: () => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ monthlySummary, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 w-full">
      <h2 className="text-lg font-semibold text-text mb-4">
        {monthlySummary.year}年 {monthlySummary.month}月
      </h2>
      <table className="w-full table-fixed text-sm border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left">日付</th>
            <th className="border border-gray-300 px-2 py-1 text-center">朝食</th>
            <th className="border border-gray-300 px-2 py-1 text-center">昼食</th>
            <th className="border border-gray-300 px-2 py-1 text-center">夕食</th>
          </tr>
        </thead>
        <tbody>
          {monthlySummary.dailyData.map((row) => (
            <tr key={row.day}>
              <td className="border border-gray-300 px-2 py-1">{row.day}日</td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                <span className={`text-lg font-semibold ${row.breakfast > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                  {row.breakfast !== undefined ? row.breakfast : 0}
                </span>
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                <span className={`text-lg font-semibold ${row.lunch > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                  {row.lunch !== undefined ? row.lunch : 0}
                </span>
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                <span className={`text-lg font-semibold ${row.dinner > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                  {row.dinner !== undefined ? row.dinner : 0}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 月間サマリーから食事予約フォームへ戻るボタン */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onEdit}
          className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
        >
          戻る
        </button>
      </div>
    </div>
  );
};
