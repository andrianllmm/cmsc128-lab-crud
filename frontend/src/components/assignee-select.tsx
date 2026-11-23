import type { ListUser } from "@/types/lists";
import { UserAvatar } from "@/components/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Stands in for "no assignee", since a select item needs a string value
const UNASSIGNED = "unassigned";

interface AssigneeSelectProps {
  id?: string;
  members: ListUser[];
  // The assignee's id, or `null` if unassigned
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
}

export function AssigneeSelect({
  id,
  members,
  value,
  onValueChange,
}: AssigneeSelectProps) {
  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(v) => onValueChange(v === UNASSIGNED ? null : v)}
    >
      <SelectTrigger
        id={id}
        size="sm"
        aria-label="Assignee"
        className="border-0 dark:bg-transparent"
      >
        <SelectValue>
          {(v: string | null) => {
            const member = members.find((m) => m._id === v);
            return member ? <Member member={member} /> : "Unassigned";
          }}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {members.map((m) => (
          <SelectItem key={m._id} value={m._id}>
            <Member member={m} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Member({ member }: { member: ListUser }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <UserAvatar displayName={member.displayName} size="sm" />
      <span className="truncate">{member.displayName}</span>
    </span>
  );
}
