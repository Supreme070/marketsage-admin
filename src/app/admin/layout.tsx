import { AdminProvider } from "@/components/admin/AdminProvider";
import { AdminLayout as AdminLayoutComponent } from "@/components/admin/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {/* Offline indicator - shows banner at top when offline */}
      <OfflineIndicator />

      <AdminProvider>
        <AdminLayoutComponent>{children}</AdminLayoutComponent>
      </AdminProvider>
    </ErrorBoundary>
  );
}
