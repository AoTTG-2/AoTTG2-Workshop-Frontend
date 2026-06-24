import AppFrame from "../app-frame";
import { ModerationShell } from "../../page/Moderation";

export default function ModerationPage() {
  return (
    <AppFrame requireAuth>
      <ModerationShell />
    </AppFrame>
  );
}
