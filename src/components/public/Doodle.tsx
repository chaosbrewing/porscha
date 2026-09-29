/**
 * A small hand-drawn arrow that points from a handwritten note toward
 * whatever it is about. Decorative only; inherits the note's colour.
 */
export function Doodle({
  direction = "down-left",
  className = "",
}: {
  direction?: "down-left" | "down-right" | "up-right" | "left";
  className?: string;
}) {
  const rotate = {
    "down-left": "",
    "down-right": "-scale-x-100",
    "up-right": "rotate-180",
    left: "rotate-45",
  }[direction];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      width="34"
      height="34"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${rotate} ${className}`}
    >
      <path d="M33 5 C 30 16, 22 27, 8 33" />
      <path d="M15 33.5 L 8 33 L 10.5 26.5" />
    </svg>
  );
}
