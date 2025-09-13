export interface MealUsers {
  count: number;
  users: string[];
}

export interface DailyData {
  day: number;
  breakfast: MealUsers;
  lunch: MealUsers;
  dinner: MealUsers;
}
