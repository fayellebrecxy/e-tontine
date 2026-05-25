import { GroupsShell } from "@/components/groups/groups-shell";

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <GroupsShell>{children}</GroupsShell>;
}
