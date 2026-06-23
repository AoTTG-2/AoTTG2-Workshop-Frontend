import { Suspense } from "react";
import AppFrame from "../../app-frame";
import { AuthCallback } from "../../../page/AuthCallback";

export default function AuthCallbackPage() {
  return (
    <AppFrame>
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    </AppFrame>
  );
}
