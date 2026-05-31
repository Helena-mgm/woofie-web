/**
 * Utilitaires CSS et classes
 * Règle: fonctions simples < 5 lignes
 */

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getBgGradient(from: string, to: string): string {
  return `bg-gradient-to-r from-${from} to-${to}`;
}

export function getHoverScale(scale: number = 1.05): object {
  return { scale };
}
