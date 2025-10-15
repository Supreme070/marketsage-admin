"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to admin login
    router.push("/admin-login");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">MarketSage Admin Portal</h1>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
