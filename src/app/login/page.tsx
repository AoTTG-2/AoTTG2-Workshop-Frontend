import AppFrame from "../app-frame";
import Login from "../../page/Login";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AppFrame>
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </AppFrame>
  );
}
