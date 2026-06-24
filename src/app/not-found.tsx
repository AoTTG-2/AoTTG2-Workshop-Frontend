"use client";

import { Card, CardContent, CardTitle } from "@aottg2/ui";
import AppFrame from "./app-frame";

export default function NotFound() {
  return (
    <AppFrame>
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12 text-foreground">
        <Card className="w-full max-w-md border-border bg-card/90 text-card-foreground">
          <CardContent className="grid gap-3 p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-muted-foreground">404</p>
            <CardTitle>NOT FOUND</CardTitle>
          </CardContent>
        </Card>
      </main>
    </AppFrame>
  );
}
