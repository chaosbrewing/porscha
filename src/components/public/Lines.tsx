import { Fragment } from "react";

/** Renders an array of lines with deliberate breaks between them. */
export function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <>
              {" "}
              <br />
            </>
          ) : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
