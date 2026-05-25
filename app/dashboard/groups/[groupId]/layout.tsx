import { GroupShell } from "@/components/groups/group-shell";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return <GroupShell groupId={groupId}>{children}</GroupShell>;
}
