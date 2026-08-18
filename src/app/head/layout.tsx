import type { ReactNode } from "react";
import HeadSidebar from "../components/portals/HeadSidebar";
import PortalShell from "../components/portals/PortalShell";

export default function HeadLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PortalShell
      sidebar={<HeadSidebar />}
      portalName="Head Portal"
    >
      {children}
    </PortalShell>
  );
}