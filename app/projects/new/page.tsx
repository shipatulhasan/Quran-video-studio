"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not create project");
    } else {
      router.push(`/projects/${data.projectId}/csv`);
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-sm tracking-[.3em] text-muted-foreground">STEP 1 / PROJECT</p>
      <h1 className="mt-3 text-4xl font-bold">Create a project</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Name your project</CardTitle>
          <CardDescription>Organize your timed overlay segments under a project.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={createProject}>
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My SyncCaster Project"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Continue to CSV upload"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
