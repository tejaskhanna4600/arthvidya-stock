/**
 * TK logo displayed in the top-right of each panel. Blends with the dark theme.
 * Place your logo at: frontend/public/assets/tk-logo.png
 */
export default function PanelLogo() {
  return (
    <img
      src="/assets/tk-logo.png"
      alt="TK Logo"
      className="h-10 w-10 object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
      title="Arthvidya Stock Exchange"
    />
  );
}
