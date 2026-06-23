import React from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;

    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    return Math.min(5, Math.floor(score / 1.2)); // Scale score to 0-4
  };

  const strength = getStrength(password);

  const getStrengthLabel = (strengthLevel: number) => {
    switch (strengthLevel) {
      case 0:
        return 'Empty';
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Strong';
      default:
        return 'Very Weak';
    }
  };

  const getStrengthColor = (strengthLevel: number) => {
    switch (strengthLevel) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-amber-500';
      case 3:
        return 'bg-indigo-500';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className="font-semibold text-foreground">{getStrengthLabel(strength)}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className={`h-full flex-1 rounded-full transition-colors duration-300 ${
              index <= strength ? getStrengthColor(strength) : 'bg-secondary'
            }`}
          />
        ))}
      </div>
      <ul className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
        <li className={password.length >= 8 ? 'text-emerald-500 font-semibold' : ''}>
          ✓ At least 8 characters
        </li>
        <li className={/[A-Z]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>
          ✓ One uppercase letter
        </li>
        <li className={/[0-9]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>
          ✓ One number
        </li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>
          ✓ One special character
        </li>
      </ul>
    </div>
  );
};
