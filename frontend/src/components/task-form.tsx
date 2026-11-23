import { useId, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { createTaskSchema, type CreateTaskInput } from "@/schemas/tasks";
import { TITLE_MAX_LENGTH, type Task } from "@/types/tasks";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { FormField } from "@/components/ui/form-field";
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
}

type TaskFormValues = z.input<typeof createTaskSchema>;

export function TaskForm({
  task,
  members,
  submitLabel = "Create",
  onSubmit,
}: TaskFormProps) {
  // Unique per instance since create and edit forms can coexist
  const id = useId();

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
      className="flex flex-col gap-4"
    >
      {/* Title */}
      <form.Field name="title">
        {(field) => {
          // Only the create form parses keywords
          const parsed = task ? null : parse(field.state.value, dismissed);
          return (
            <FormField
              htmlFor={`${id}-title`}
              label="Title"
              error={field.state.meta.errors[0]?.message}
            >
              <HighlightedInput
                id={`${id}-title`}
                matches={parsed?.matches ?? []}
                placeholder={
                  task
                    ? "What do you want to do?"
                    : "e.g. Buy milk tomorrow 5pm #personal !high"
                }
                maxLength={TITLE_MAX_LENGTH}
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
                autoFocus={!task}
              />
              {/* Preview the title that will be saved once keywords are removed */}
              {parsed && parsed.title !== field.state.value.trim() && (
                <p className="text-sm text-muted-foreground">
                  Saved as &ldquo;{parsed.title}&rdquo;
                </p>
              )}
            </FormField>
          );
        }}
      </form.Field>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        {/* Due date */}
        <form.Field name="dueDate">
          {(field) => (
            <FormField
              htmlFor={`${id}-dueDate`}
              label="Due date"
              error={field.state.meta.errors[0]?.message}
              className="col-span-2 min-w-0 sm:flex-1"
            >
              <DateTimePicker
                id={`${id}-dueDate`}
                selected={field.state.value ?? undefined}
                onSelect={(date) => field.handleChange(date ?? null)}
                placeholder="No due date"
                className="w-full"
              />
            </FormField>
          )}
        </form.Field>

        {/* Priority */}
        <form.Field name="priority">
          {(field) => (
            <FormField
              htmlFor={`${id}-priority`}
              label="Priority"
              error={field.state.meta.errors[0]?.message}
            >
              <PrioritySelect
                id={`${id}-priority`}
                value={field.state.value}
                onValueChange={field.handleChange}
              />
            </FormField>
          )}
        </form.Field>

        {/* Tag */}
        <form.Field name="tag">
          {(field) => (
            <FormField
              htmlFor={`${id}-tag`}
              label="Tag"
              error={field.state.meta.errors[0]?.message}
            >
              <TagSelect
                id={`${id}-tag`}
                value={field.state.value}
                onValueChange={field.handleChange}
              />
            </FormField>
          )}
        </form.Field>

        {/* Assignee */}
        {members && (
          <form.Field name="assignee">
            {(field) => (
              <FormField
                htmlFor={`${id}-assignee`}
                label="Assignee"
                error={field.state.meta.errors[0]?.message}
                className="col-span-2 min-w-0 sm:col-span-1 sm:flex-1"
              >
                <AssigneeSelect
                  id={`${id}-assignee`}
                  members={members}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              </FormField>
            )}
          </form.Field>
        )}
      </div>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
