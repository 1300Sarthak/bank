interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "red" | "yellow" | "blue" | "accent";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "broker-badge",
  green: "rec-strong-buy",
  red: "rec-avoid",
  yellow: "rec-hold",
  blue: "rec-buy",
  accent: "broker-badge",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
