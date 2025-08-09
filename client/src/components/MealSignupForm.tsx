import React from 'react';

interface MealSignup {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface MealSignupFormProps {
  mealSignup: MealSignup;
  setMealSignup: React.Dispatch<React.SetStateAction<MealSignup>>;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  message: string;
  currentDate: Date;
  changeDate: (days: number) => void;
}

export const MealSignupForm: React.FC<MealSignupFormProps> = ({
  mealSignup,
  setMealSignup,
  onSave,
  onCancel,
  loading,
  message,
  currentDate,
  changeDate,
}) => {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日（${weekday}）`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-text">
              📅 {formatDate(currentDate)}
            </div>
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-text mb-6">今日の食事予定：</h2>
      <div className="space-y-4">
        {/* Breakfast */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌅</span>
            <span className="text-lg font-medium text-text">朝食</span>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={mealSignup.breakfast}
              onChange={(e) => setMealSignup({ ...mealSignup, breakfast: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-text">必要</span>
          </label>
        </div>

        {/* Lunch */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌞</span>
            <span className="text-lg font-medium text-text">昼食</span>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={mealSignup.lunch}
              onChange={(e) => setMealSignup({ ...mealSignup, lunch: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-text">必要</span>
          </label>
        </div>

        {/* Dinner */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌙</span>
            <span className="text-lg font-medium text-text">夕食</span>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={mealSignup.dinner}
              onChange={(e) => setMealSignup({ ...mealSignup, dinner: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-text">必要</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={onSave}
        disabled={loading}
        className="w-full mt-6 bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <span>💾</span>
        <span>{loading ? '保存中...' : '保存する'}</span>
      </button>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        キャンセル
      </button>

      {/* Message */}
      {message && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 text-center text-sm">
          {message}
        </div>
      )}
    </div>
  );
};
