// Polyfill for web environment
if (typeof window === 'undefined') {
  (global as any).window = {};
}

if (typeof document === 'undefined') {
  (global as any).document = {};
} 