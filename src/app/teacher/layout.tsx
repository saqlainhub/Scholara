import type { ReactNode } from "react";
import TeacherSidebar from "../components/portals/TeacherSidebar";
import PortalShell from "../components/portals/PortalShell";

export default function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PortalShell
      sidebar={<TeacherSidebar />}
      portalName="Teacher Portal"
    >
      {children}
    </PortalShell>
  );
}