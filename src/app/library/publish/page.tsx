import AppFrame from "../../app-frame";
import { CreateAsset } from "../../../page/CreateAsset";

export default function PublishSpaPage() {
  return (
    <AppFrame requireAuth>
      <CreateAsset />
    </AppFrame>
  );
}
