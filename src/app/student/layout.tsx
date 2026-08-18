import type { ReactNode } from "react";

import StudentSidebar from "../components/portals/StudentSidebar";
import PortalShell from "../components/portals/PortalShell";

export default function StudentLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">

            <div className="flex-1">
                <PortalShell
                    sidebar={
                        <StudentSidebar />
                    }
                    portalName="Student Portal"
                >
                    {children}
                </PortalShell>
            </div>
        </div>
    );
}