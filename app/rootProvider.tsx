"use client";

import { PropsWithChildren } from "react";
import { MiniAppProvider } from "./providers/MiniAppProvider";

export function RootProvider({ children }: PropsWithChildren) {
  return <MiniAppProvider>{children}</MiniAppProvider>;
}
