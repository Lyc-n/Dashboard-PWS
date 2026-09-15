import { forwardRef    } from "react";
import type {InputHTMLAttributes, LabelHTMLAttributes, ReactNode} from "react";
import { cn } from "@/lib/utils";

export interface RadioCardProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "title"> {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  title: ReactNode;
  description?: ReactNode;
}

export const RadioCard = forwardRef<HTMLLabelElement, RadioCardProps>(
  ({ inputProps, title, description, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "grid cursor-pointer gap-1 rounded-[10px] border border-line bg-surface p-3",
        "has-[:checked]:border-accent has-[:checked]:bg-accent-light",
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        <input type="radio" className="accent-accent" {...inputProps} />
        <b className="text-[13px]">{title}</b>
      </span>
      {description && <small className="text-xs text-muted">{description}</small>}
      {children}
    </label>
  ),
);

RadioCard.displayName = "RadioCard";