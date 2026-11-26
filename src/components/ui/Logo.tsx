import { cn } from '@/lib/utils';

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('text-primary', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="HearCare logo"
    >
      <path
        d="M26 16C18.82 16 13 21.82 13 29C13 33.4 15.2 37.3 18.5 39.6C20.5 41 21.5 43.2 21.5 45.6V46.5C21.5 50.09 24.41 53 28 53C31.1 53 33.7 50.8 34.3 47.8C34.9 44.9 36.2 42.3 38 40.1C40.5 37.1 42 33.2 42 29C42 21.82 36.18 16 29 16H26Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M47 22C49.5 24.5 51 27.6 51 31C51 34.4 49.5 37.5 47 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M29.5 33.5C29.5 33.5 25 30.6 25 27.9C25 26.6 26.1 25.6 27.3 25.6C28.2 25.6 29 26.1 29.5 26.8C30 26.1 30.8 25.6 31.7 25.6C32.9 25.6 34 26.6 34 27.9C34 30.6 29.5 33.5 29.5 33.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
