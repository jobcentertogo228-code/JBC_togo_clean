import { ProtectedShell } from "@/components/auth/protected-shell";
import { requireAdmin } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <ProtectedShell title="Administration" home="/admin">{children}</ProtectedShell>;
}
