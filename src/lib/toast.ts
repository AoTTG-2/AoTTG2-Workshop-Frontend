import { toast as sonnerToast } from "@aottg2/ui";
import type { ReactNode } from "react";
import type { ExternalToast } from "sonner";

type ToastOptionsWithContent = Omit<ExternalToast, "description"> & {
  description: ReactNode;
};

type ToastMessage = ReactNode | (() => ReactNode);

export const toast = {
  success(message: ToastMessage, options: ToastOptionsWithContent) {
    return sonnerToast.success(message, options);
  },
  error(message: ToastMessage, options: ToastOptionsWithContent) {
    return sonnerToast.error(message, options);
  },
  info(message: ToastMessage, options: ToastOptionsWithContent) {
    return sonnerToast.info(message, options);
  },
  warning(message: ToastMessage, options: ToastOptionsWithContent) {
    return sonnerToast.warning(message, options);
  },
};
