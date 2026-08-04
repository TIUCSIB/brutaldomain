import { redirect } from "next/navigation";

import { LoginPage } from "@/components/login-page";
import { getSession } from "@/lib/auth/session";

interface HomePageProps {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  return <LoginPage error={params.error} nextPath={params.next} />;
}
