export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={className}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 40 40"
                fill="none"
                className="h-full w-full"
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
                <path
                    d="M20 2L5 10L10 38L20 30L30 38L35 10L20 2Z"
                    fill="url(#logo-gradient)"
                    className="opacity-20"
                />
                <path
                    d="M20 6L9 12L12 32L20 26L28 32L31 12L20 6Z"
                    fill="url(#logo-gradient)"
                    className="opacity-40"
                />
                <path
                    d="M20 12L14 16L16 26L20 23L24 26L26 16L20 12Z"
                    fill="url(#logo-gradient)"
                />
                <circle cx="20" cy="20" r="1.5" fill="white" />
            </svg>
        </div>
    );
};
