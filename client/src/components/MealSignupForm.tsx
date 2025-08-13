import React, { useEffect } from 'react';
import type { DailyMealSignup } from '../types/DailyData';
import { fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup } from '../api/mealSignup';
import { saveMealSignupApi } from '../api/meals';
import { formatDateForAPI } from '../App';

interface MealSignupFormProps {
  monthlyMealSignup: DailyMealSignup[];
  setMonthlyMealSignup: React.Dispatch<React.SetStateAction<DailyMealSignup[]>>;
  onSave: () => void;
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

  // 全選択ボタン用ハンドラ
  const handleSelectAll = async () => {
    const updatedMonthlyMealSignup = monthlyMealSignup.map(item => ({
      ...item,
      breakfast: true,
      lunch: true,
      dinner: true,
    }));

    try {
      const token = await getToken();
      await saveSelfMonthlyMealSignup(
        updatedMonthlyMealSignup,
        validMonth.getFullYear(),
        validMonth.getMonth() + 1,
        organizationId,
        token
      );
      setMonthlyMealSignup(updatedMonthlyMealSignup);
    } catch (error) {
      console.error("全選択の更新に失敗しました:", error);
    }
  };

  // 全解除ボタン用ハンドラ
  const handleDeselectAll = async () => {
    const updatedMonthlyMealSignup = monthlyMealSignup.map(item => ({
      ...item,
      breakfast: false,
      lunch: false,
      dinner: false,
    }));

    try {
      const token = await getToken();
      await saveSelfMonthlyMealSignup(
        updatedMonthlyMealSignup,
        validMonth.getFullYear(),
        validMonth.getMonth() + 1,
        organizationId,
        token
      );
      setMonthlyMealSignup(updatedMonthlyMealSignup);
    } catch (error) {
      console.error("全解除の更新に失敗しました:", error);
    }
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
      {/* 全選択・全解除ボタン */}
      <div className="flex justify-end mb-4 space-x-2">
        <button
          onClick={handleSelectAll}
          className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
        >
          全選択
        </button>
        <button
          onClick={handleDeselectAll}
          className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
        >
          全解除
        </button>
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
                        const targetDate = new Date(validMonth.getFullYear(), validMonth.getMonth(), daily.day, 12);
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
                        const targetDate = new Date(validMonth.getFullYear(), validMonth.getMonth(), daily.day, 12);
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
                    onChange={async (e) => {
                      const updatedDay = { ...daily, dinner: e.target.checked };
                      try {
                        const targetDate = new Date(validMonth.getFullYear(), validMonth.getMonth(), daily.day, 12);
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Message */}
      {message && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 text-center text-sm">
          {message}
        </div>
      )}
      {/* 月間サマリー表示ボタン */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={async () => {
            try {
              // 最新データを再取得してから月間サマリーに移行
              const token = await getToken();
              const data = await fetchSelfMonthlyMealSignup(
                validMonth.getFullYear(),
                validMonth.getMonth() + 1,
                token
              );
              if (data && data.length > 0) {
                setMonthlyMealSignup(data);
              }
              onSave();
            } catch (error) {
              console.error('月間サマリー表示時のデータ更新に失敗しました:', error);
              onSave(); // エラーでも画面遷移は行う
            }
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          月間サマリー表示
        </button>
      </div>
    </div>
  );
};
