
import { UserProfile, MacroCalculations, ActivityMultiplier } from "./types";

export const calculateMacros = (profile: UserProfile): MacroCalculations => {
  // Harris-Benedict Equation
  let bmr: number;
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }

  const tdee = bmr * ActivityMultiplier[profile.activityLevel];
  
  // Calorie Target based on goalType
  let targetCalories = tdee;
  
  if (profile.goalType === 'muscle_gain') {
    targetCalories = tdee + 300; // Superavit
  } else if (profile.goalType === 'weight_loss' || profile.goalType === 'belly_fat') {
    targetCalories = tdee - 500; // Deficit
  } else if (profile.goalType === 'definition') {
    targetCalories = tdee - 200; // Leve deficit
  }

  // Protein adjustment based on goal
  let proteinRatio = 2.0; // Padrão
  if (profile.goalType === 'muscle_gain' || profile.goalType === 'definition') {
    proteinRatio = 2.2;
  } else if (profile.goalType === 'health') {
    proteinRatio = 1.6;
  }

  const protein = profile.weight * proteinRatio;
  const proteinCalories = protein * 4;
  
  // Fat: ~25% of total calories
  const fatsCalories = targetCalories * 0.25;
  const fats = fatsCalories / 9;
  
  // Carbs: Remaining calories
  const carbsCalories = targetCalories - proteinCalories - fatsCalories;
  const carbs = carbsCalories / 4;

  // Hydration: 35ml per kg
  const hydrationLiters = (profile.weight * 35) / 1000;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
    hydrationLiters: parseFloat(hydrationLiters.toFixed(1))
  };
};

export const UI_COLORS = {
  primary: '#22c55e', // Green 500
  secondary: '#16a34a', // Green 600
  accent: '#f59e0b', // Amber 500
  background: '#f8fafc', // Slate 50
  card: '#ffffff',
  text: '#1e293b' // Slate 800
};
