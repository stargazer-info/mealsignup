import React from 'react';

interface MealSignup {
  breakfast: boolean;
  lunch: boolean;
  dinner: number;
}

// 各日の食事予約状態を表す型
export interface DailyMealSignup {
  day: number;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
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
}) => {
  const validMonth = currentMonth || new Date();

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
                  <button
                    onClick={() => {
                      const updated = [...monthlyMealSignup];
                      updated[index].breakfast = !updated[index].breakfast;
                      setMonthlyMealSignup(updated);
                    }}
                    className={`text-2xl ${daily.breakfast ? 'text-green-600' : 'text-gray-300'}`}
                  >
                    ✔
                  </button>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => {
                      const updated = [...monthlyMealSignup];
                      updated[index].lunch = !updated[index].lunch;
                      setMonthlyMealSignup(updated);
                    }}
                    className={`text-2xl ${daily.lunch ? 'text-green-600' : 'text-gray-300'}`}
                  >
                    ✔
                  </button>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => {
                      const updated = [...monthlyMealSignup];
                      updated[index].dinner = !updated[index].dinner;
                      setMonthlyMealSignup(updated);
                    }}
                    className={`text-2xl ${daily.dinner ? 'text-green-600' : 'text-gray-300'}`}
                  >
                    ✔
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          onClick={onSave}
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
