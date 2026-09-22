export default function FadeIn({ duration = 1200, delay = 0, children, style, ...rest }) {
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
