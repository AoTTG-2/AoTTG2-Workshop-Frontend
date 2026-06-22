import AppFrame from "../app-frame";
import { DashboardShell } from "../../page/Dashboard";

export default function DashboardPage() {
  return (
    <AppFrame requireAuth>
      <DashboardShell />
    </AppFrame>
  );
}
