@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --safe-area-inset-top: env(safe-area-inset-top, 0px);
    --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
    --safe-area-inset-left: env(safe-area-inset-left, 0px);
    --safe-area-inset-right: env(safe-area-inset-right, 0px);

    --brand-color: #0284c7;
    --app-bg: #f8fafc;
    --app-text: #0f172a;
    --app-panel: rgba(255, 255, 255, 0.82);
    --app-border: rgba(148, 163, 184, 0.2);
    --app-gradient-1: rgba(14, 165, 233, 0.14);
    --app-gradient-2: rgba(16, 185, 129, 0.08);
  }

  .dark {
    --app-bg: #0f172a;
    --app-text: #e2e8f0;
    --app-panel: rgba(15, 23, 42, 0.82);
    --app-border: rgba(71, 85, 105, 0.35);
    --app-gradient-1: rgba(2, 132, 199, 0.18);
    --app-gradient-2: rgba(16, 185, 129, 0.1);
  }

  html {
    -webkit-tap-highlight-color: transparent;
    scroll-behavior: smooth;
  }

  body {
    @apply antialiased;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    background-color: var(--app-bg);
    color: var(--app-text);
    background-image:
      radial-gradient(circle at top left, var(--app-gradient-1), transparent 26%),
      radial-gradient(circle at top right, var(--app-gradient-2), transparent 22%),
      linear-gradient(180deg, var(--app-bg) 0%, var(--app-bg) 100%);
    min-height: 100vh;
    transition:
      background-color 0.25s ease,
      color 0.25s ease,
      background-image 0.25s ease;
  }

  .overflow-y-auto,
  .overflow-x-auto,
  .overflow-auto {
    -webkit-overflow-scrolling: touch;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
}

@layer components {
  .safe-area-inset-top {
    padding-top: var(--safe-area-inset-top);
  }

  .safe-area-inset-bottom {
    padding-bottom: var(--safe-area-inset-bottom);
  }

  .touch-focus:focus-visible {
    @apply outline-none ring-2 ring-offset-2;
    ring-color: var(--brand-color);
  }

  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }

  .pull-indicator {
    @apply flex items-center justify-center h-12 text-gray-400;
  }

  .card-interactive {
    @apply transition-all duration-200 hover:shadow-card-hover active:scale-[0.98];
  }

  .skeleton {
    @apply animate-pulse rounded;
    background-color: rgba(148, 163, 184, 0.2);
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .text-balance {
    text-wrap: balance;
  }

  .glass-panel {
    background: var(--app-panel);
    border: 1px solid var(--app-border);
    backdrop-filter: blur(18px);
  }

  .brand-bg {
    background-color: var(--brand-color);
  }

  .brand-text {
    color: var(--brand-color);
  }

  .brand-border {
    border-color: var(--brand-color);
  }
}

@layer utilities {
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

@media (display-mode: standalone) {
  body {
    overscroll-behavior-y: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}