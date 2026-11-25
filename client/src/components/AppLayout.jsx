import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (pathname.startsWith("/mentor")) return <>{children}</>;

  return (
    <div className="app-shell">
      <SiteHeader />
      <div className="app-main">{children}</div>
      <SiteFooter />
    </div>
  );
}
