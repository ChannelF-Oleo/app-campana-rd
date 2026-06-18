const fs = require('fs');
let css = fs.readFileSync('src/global.css', 'utf8');

const replacements = [
  // Backgrounds (white-ish) -> surface
  [/background-color:\s*(#ffffff|#fff|white|#f8fafc|#f4f7f6|#f9fafb|#f3f4f6);/gi, 'background-color: var(--color-surface);'],
  [/background:\s*(#ffffff|#fff|white|#f8fafc|#f4f7f6|#f9fafb|#f3f4f6);/gi, 'background: var(--color-surface);'],
  
  // Backgrounds (dark-ish) -> if there's any hardcoded dark backgrounds meant for light mode, they are probably text or specific elements, let's leave them.

  // Text Main (dark colors)
  [/color:\s*(#1f2937|#111827|#374151|#1e293b|#333333|#333|#000000|#000|black|#3c4043|#202124);/gi, 'color: var(--color-text-main);'],
  
  // Text Muted (gray colors)
  [/color:\s*(#6b7280|#4b5563|#9ca3af|#64748b|#94a3b8|#5f6368);/gi, 'color: var(--color-text-muted);'],
  
  // Borders
  [/border:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border: $1var(--color-border);'],
  [/border-bottom:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-bottom: $1var(--color-border);'],
  [/border-top:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-top: $1var(--color-border);'],
  [/border-color:\s*(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-color: var(--color-border);'],
  
  // Primary Colors (convert to var(--primary))
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#2563eb|#1d4ed8|#3b82f6|#004d99|#003d80|#1a73e8);/gi, '$1: $2var(--primary);'],
  
  // Danger
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#ef4444|#dc2626|#f87171|#ea4335);/gi, '$1: $2var(--danger);'],

  // Success
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#10b981|#059669|#22c55e|#16a34a|#34a853);/gi, '$1: $2var(--success);'],

  // Warning
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#f59e0b|#d97706|#eab308|#ca8a04|#fbbc04);/gi, '$1: $2var(--warning);'],

  // Fix common rgba hover issues (optional, but let's try to map them to variables if we had them)
  // Instead of replacing all rgba, we will just ensure the basic colors are variables.
];

replacements.forEach(([regex, replacement]) => {
  css = css.replace(regex, replacement);
});

fs.writeFileSync('src/global.css', css, 'utf8');
console.log('Colors replaced with variables.');
