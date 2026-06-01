import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="relative size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
          <InfinityIcon className="size-5" strokeWidth={2.5} />
        </div>
      </div>
      <span className="font-display font-bold text-xl tracking-tight">
        Limitless
      </span>
    </Link>
  );
}
