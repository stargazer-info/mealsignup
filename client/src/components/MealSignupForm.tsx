import React, { useEffect } from 'react';
import type { DailyMealSignup } from '../types/DailyData';
import { fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup } from '../api/mealSignup';
import { saveMealSignupApi } from '../api/meals';
import { formatDateForAPI } from '../App';

interface MealSignup {
  breakfast: boolean;
  lunch: boolean;
  dinner: number;
}

interface MealSignupFormProps {
  monthlyMealSignup: DailyMealSignup[];
  setMonthlyMealSignup: React.Dispatch<React.SetStateAction<DailyMealSignup[]>>;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  message: string;
  currentMonth: Date;
  changeMonth: (offset: number) => void;
  organizationId: string;
  getToken: () => Promise<string>;
}

export const MealSignupForm: React.FC<MealSignupFormProps> = ({
  monthlyMealSignup,
  setMonthlyMealSignup,
  onSave,
  onCancel,
  loading,
  message,
  currentMonth,
  changeMonth,
  organizationId,
  getToken,
}) => {
  const validMonth = currentMonth || new Date();

  // 月の日数を取得して初期値を生成する関数
  const generateInitialMonthlyData = (month: Date): DailyMealSignup[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      breakfast: false,
      lunch: false,
      dinner: false,
    }));
  };

  // 月が変更されたタイミングでAPIから月次予約データを取得
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const token = await getToken();
        const data = await fetchSelfMonthlyMealSignup(
          validMonth.getFullYear(),
          validMonth.getMonth() + 1,
          token
        );
        
        console.log('API Response Data:', data);
        
        // APIのレスポンスが期待する形式であることを確認し、状態を更新
        if (data && data.length > 0) {
          setMonthlyMealSignup(data);
        } else {
          // APIの結果が空の場合は初期値（各日の予約なし）を生成する
          const initialData = generateInitialMonthlyData(validMonth);
          setMonthlyMealSignup(initialData);
        }
      } catch (error) {
        console.error('月次データの取得に失敗しました', error);
        // エラー時は初期状態を設定
        const initialData = generateInitialMonthlyData(validMonth);
        setMonthlyMealSignup(initialData);
      }
    };

    fetchMonthlyData();
  }, [validMonth, setMonthlyMealSignup, organizationId, getToken]);
  const updateDay = (updatedDay: DailyMealSignup) => {
    setMonthlyMealSignup((prev) =>
      prev.map((day) => (day.day === updatedDay.day ? { ...day, ...updatedDay } : day))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-text">
              📅 {validMonth.getFullYear()}年{validMonth.getMonth() + 1}月
            </div>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1">日付</th>
              <th className="border border-gray-300 px-2 py-1">朝食</th>
              <th className="border border-gray-300 px-2 py-1">昼食</th>
              <th className="border border-gray-300 px-2 py-1">夕食</th>
            </tr>
          </thead>
          <tbody>
            {monthlyMealSignup.map((daily, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-2 py-1 text-center">{daily.day}日</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={daily.breakfast}
                    onChange={async (e) => {
                      const updatedDay = { ...daily, breakfast: e.target.checked };
                      try {
                        const targetDate = new Date(validMonth.getFullYear(), validMonth.getMonth(), daily.day);
                        const token = await getToken();
                        await saveMealSignupApi(
                          formatDateForAPI(targetDate),
                          {
                            breakfast: updatedDay.breakfast,
                            lunch: updatedDay.lunch,
                            dinner: updatedDay.dinner,
                          },
                          organizationId,
                          token
                        );
                        updateDay(updatedDay);
                      } catch (error) {
                        console.error(`Day ${daily.day} の予約更新に失敗しました:`, error);
                      }
                    }}
                    className="transform scale-125"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={daily.lunch}
                    onChange={async (e) => {
                      const updatedDay = { ...daily, lunch: e.target.checked };
                      try {
                        const targetDate = new Date(validMonth.getFullYear(), validMonth.getMonth(), daily.day);
                        const token = await getToken();
                        await saveMealSignupApi(
                          formatDateForAPI(targetDate),
                          {
                            breakfast: updatedDay.breakfast,
                            lunch: updatedDay.lunch,
                            dinner: updatedDay.dinner,
                          },
                          organizationId,
                          token
                        );
                        updateDay(updatedDay);
                      } catch (error) {
                        console.error(`Day ${daily.day} の予約更新に失敗しました:`, error);
                      }
                    }}
                    className="transform scale-125"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={daily.dinner}
                    onChange={(e) => {
                      const updatedDay = { ...daily, dinner: e.target.checked };
                      updateDay(updatedDay);
                    }}
                    className="transform scale-125"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          onClick={async () => {
            try {
              console.log('Saving monthlyMealSignup:', monthlyMealSignup);
              console.log('Year:', validMonth.getFullYear());
              console.log('Month:', validMonth.getMonth() + 1);
              console.log('OrganizationId:', organizationId);
              const token = await getToken();
              await saveSelfMonthlyMealSignup(
                monthlyMealSignup,
                validMonth.getFullYear(),
                validMonth.getMonth() + 1,
                organizationId,
                token
              );
              onSave();
            } catch (error) {
              console.error(error);
            }
          }}
          disabled={loading}
          className="w-full bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
        >
          <span>{loading ? '保存中...' : '保存する'}</span>
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          キャンセル
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 text-center text-sm">
          {message}
        </div>
      )}
    </div>
  );
};
