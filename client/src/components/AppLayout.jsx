import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <div className="app-main">{children}</div>
      <SiteFooter />
    </div>
  );
}
