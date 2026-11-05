/**
 * Static "liquid petroleum" underline for the mobile menu's current page, in the same
 * look as the desktop <OilUnderline>: a glossy navy oil line with a white specular
 * highlight, a faint petroleum iridescence and an occasional sheen sweep.
 * Pure CSS (see `.oil-bar` in globals.css) and only transform/opacity animate, so it
 * stays cheap on phones; under reduced motion it is simply drawn.
 */
export function OilBar() {
  return (
    <span aria-hidden className="oil-bar">
      <span className="oil-bar-sheen" />
    </span>
  );
}
