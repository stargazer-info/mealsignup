import React from 'react'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">MealSignup</h1>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">👤</span>
              </div>
              <span className="text-sm font-medium text-text">田中</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <span className="text-lg">←</span>
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold text-text">📅 2024年1月15日（月）</div>
            </div>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>

        {/* Meal Signup Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
                  defaultChecked 
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
                  defaultChecked 
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium text-text">必要</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full mt-6 bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <span>💾</span>
            <span>保存する</span>
          </button>
        </div>

        {/* Family Overview Link */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <button className="w-full flex items-center justify-center space-x-2 text-secondary hover:text-teal-600 font-medium transition-colors">
            <span>👨‍👩‍👧‍👦</span>
            <span>家族の予定を見る</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
