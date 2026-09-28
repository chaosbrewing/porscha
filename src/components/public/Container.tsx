import type { ReactNode } from "react";

/** Page gutter: 16px on phones, widening with the viewport. */
export function Container({
  children,
  className = "",
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "text";
}) {
  const max = width === "text" ? "max-w-3xl" : "max-w-7xl";
  return (
    <div className={`mx-auto w-full ${max} px-4 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
