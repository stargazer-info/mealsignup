export interface MealUsers {
  count: number;
  users: string[];
}

export interface MealTypeData {
  normal: MealUsers;
  takeout: MealUsers;
}

export interface DailyData {
  day: number;
  breakfast: MealTypeData;
  lunch: MealTypeData;
  dinner: MealTypeData;
}
