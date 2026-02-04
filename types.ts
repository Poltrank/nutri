
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type GoalType = 'weight_loss' | 'belly_fat' | 'muscle_gain' | 'definition' | 'health';

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface DailyIntake {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  message: string;
  date: string;
}

export interface AuthUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  isAdmin?: boolean;
  profile?: UserProfile;
  weightHistory?: WeightEntry[];
  dailyIntake?: DailyIntake; // Representa as adições manuais (botões +)
  logMacros?: Partial<Record<DayOfWeek, DailyIntake>>; // Representa o que veio da análise do diário de texto
}

// Fixed: Defined ActivityLevel type to be used in UserProfile and ActivityMultiplier mapping
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  goalWeight: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface WeeklyLog {
  Segunda: string;
  Terça: string;
  Quarta: string;
  Quinta: string;
  Sexta: string;
  Sábado: string;
  Domingo: string;
}

// Fixed: Added MacroCalculations interface used in constants.tsx and Dashboard.tsx
export interface MacroCalculations {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydrationLiters: number;
}

// Fixed: Added ActivityMultiplier constant used in constants.tsx
export const ActivityMultiplier: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};
