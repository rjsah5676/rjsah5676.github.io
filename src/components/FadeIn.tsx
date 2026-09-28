import type { ComponentPropsWithoutRef } from "react";

type FadeInProps = ComponentPropsWithoutRef<"div"> & {
  duration?: number;
  delay?: number;
};

export default function FadeIn({ duration = 1200, delay = 0, children, style, ...rest }: FadeInProps) {
  return (
    <div
      className="fadein-wrapper"
      style={{
        ...style,
        animationDuration: duration + "ms",
        animationDelay: delay + "ms",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
