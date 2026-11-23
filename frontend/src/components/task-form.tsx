import { useRef, useState } from "react";
import { cn } from "cn";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import { ArrowUpIcon, Loader2Icon, XIcon } from "lucide-react";
import { createTaskSchema, type CreateTaskInput } from "@/schemas/tasks";
import { TITLE_MAX_LENGTH, type Task } from "@/types/tasks";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PrioritySelect } from "@/components/priority-select";
import { TagSelect } from "@/components/tag-select";
import { AssigneeSelect } from "@/components/assignee-select";
import { HighlightedInput } from "@/components/highlighted-input";
import { parseTaskInput } from "@/lib/parse-task";
import type { ListUser } from "@/types/lists";

interface TaskFormProps {
  task?: Task;
  // Who a task can be assigned to; omitted in personal lists, which have no assignees
  members?: ListUser[];
  submitLabel?: string;
  onSubmit: (data: CreateTaskInput) => Promise<boolean>;
  // Shows a cancel button when given
  onCancel?: () => void;
  // E.g. a bigger font; applied to the input and its highlight overlay alike
  titleClassName?: string;
}

type TaskFormValues = z.input<typeof createTaskSchema>;

export function TaskForm({
  task,
  members,
  submitLabel = "Create",
  onSubmit,
  onCancel,
  titleClassName,
}: TaskFormProps) {
  const defaultValues: TaskFormValues = {
    title: task?.title ?? "",
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    priority: task?.priority ?? "None",
    tag: task?.tag ?? "Others",
    assignee: task?.assignee?._id ?? null,
  };

  // The last parsed keywords, so a field is only overwritten when its keyword
  // changes and the user's manual picks stick while they keep typing
  const lastParsed = useRef(parseTaskInput(""));

  // "@name" only parses where there are members to assign to
  const parse = (text: string, skip: ReadonlySet<string>) =>
    parseTaskInput(text, skip, members);

  // Keywords (lowercased) the user backspaced back into plain text
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: createTaskSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validators don't transform values, so parse to get the schema output
      const ok = await onSubmit(createTaskSchema.parse(value));

      // Clear the create form after a successful submit
      if (ok && !task) {
        formApi.reset();
        lastParsed.current = parseTaskInput("");
        setDismissed(new Set());
      }
    },
  });

  // Cancelling the create form discards its draft
  function handleCancel() {
    if (!task) {
      form.reset();
      lastParsed.current = parseTaskInput("");
      setDismissed(new Set());
    }
    onCancel?.();
  }

  /**
   * Fills the due date, priority, and tag fields from keywords in the title.
   * */
  function applyParsed(text: string, skip: ReadonlySet<string>) {
    const parsed = parse(text, skip);
    const last = lastParsed.current;

    if (parsed.dueDate?.getTime() !== last.dueDate?.getTime()) {
      form.setFieldValue("dueDate", parsed.dueDate ?? null);
    }
    if (parsed.priority !== last.priority) {
      form.setFieldValue("priority", parsed.priority ?? "None");
    }
    if (parsed.tag !== last.tag) {
      form.setFieldValue("tag", parsed.tag ?? "Others");
    }
    if (parsed.assignee !== last.assignee) {
      form.setFieldValue("assignee", parsed.assignee ?? null);
    }

    lastParsed.current = parsed;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Save the create form's title without its keywords
        if (!task) {
          const parsed = parse(form.getFieldValue("title"), dismissed);
          form.setFieldValue("title", parsed.title);
          lastParsed.current = parseTaskInput(parsed.title);
        }
        form.handleSubmit();
      }}
      className="flex flex-col gap-3"
    >
      {/* Title; borderless so the form reads as one text box */}
      <form.Field name="title">
        {(field) => {
          // Only the create form parses keywords
          const parsed = task ? null : parse(field.state.value, dismissed);
          const error = field.state.meta.errors[0]?.message;
          return (
            <div className="flex flex-col gap-1">
              <HighlightedInput
                aria-label="Title"
                aria-invalid={!!error}
                matches={parsed?.matches ?? []}
                placeholder={
                  task
                    ? "What do you want to do?"
                    : "e.g. Buy milk tomorrow 5pm #personal !high"
                }
                maxLength={TITLE_MAX_LENGTH}
                className={cn(
                  "border-transparent bg-transparent px-0 focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-transparent aria-invalid:ring-0 dark:bg-transparent",
                  titleClassName,
                )}
                overlayClassName={cn("px-0", titleClassName)}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (task) return;
                  // Forget dismissed keywords that were deleted, so retyping
                  // one parses it again
                  const text = e.target.value.toLowerCase();
                  const skip = new Set(
                    [...dismissed].filter((word) => text.includes(word)),
                  );
                  setDismissed(skip);
                  applyParsed(e.target.value, skip);
                }}
                // Backspace right after a keyword turns it back into plain text
                onKeyDown={(e) => {
                  if (task || e.key !== "Backspace" || !parsed) return;
                  const { selectionStart, selectionEnd } = e.currentTarget;
                  if (selectionStart !== selectionEnd) return;
                  const match = parsed.matches.find(
                    (m) => m.end === selectionStart,
                  );
                  if (!match) return;
                  e.preventDefault();
                  const skip = new Set(dismissed).add(match.text);
                  setDismissed(skip);
                  applyParsed(field.state.value, skip);
                }}
                autoFocus
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>

      <div className="flex items-end gap-2">
        {/* Compact options; wrap onto more lines on small screens */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <form.Field name="dueDate">
            {(field) => (
              <DateTimePicker
                size="sm"
                selected={field.state.value ?? undefined}
                onSelect={(date) => field.handleChange(date ?? null)}
                placeholder="Due date"
                className="max-w-full border-0 bg-transparent shadow-none dark:bg-transparent"
              />
            )}
          </form.Field>

          <form.Field name="priority">
            {(field) => (
              <PrioritySelect
                value={field.state.value}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="tag">
            {(field) => (
              <TagSelect
                value={field.state.value}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          {members && (
            <form.Field name="assignee">
              {(field) => (
                <AssigneeSelect
                  members={members}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel"
              onClick={handleCancel}
            >
              <XIcon />
            </Button>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) =>
              // Editing gets a labeled save button; creating gets a send button
              task ? (
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Loader2Icon className="animate-spin" />}
                  {submitLabel}
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  aria-label={submitLabel}
                  title={submitLabel}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <ArrowUpIcon />
                  )}
                </Button>
              )
            }
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
}
