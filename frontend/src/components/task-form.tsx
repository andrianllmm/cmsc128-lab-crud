import { useId, useRef } from "react";
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
import { HighlightedInput } from "@/components/highlighted-input";
import { parseTaskInput } from "@/lib/parse-task";

interface TaskFormProps {
  task?: Task;
  submitLabel?: string;
  onSubmit: (data: CreateTaskInput) => Promise<boolean>;
}

type TaskFormValues = z.input<typeof createTaskSchema>;

export function TaskForm({
  task,
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
  };

  // The last parsed keywords, so a field is only overwritten when its keyword
  // changes and the user's manual picks stick while they keep typing
  const lastParsed = useRef(parseTaskInput(""));

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
      }
    },
  });

  /**
   * Fills the due date, priority, and tag fields from keywords in the title.
   * */
  function applyParsed(text: string) {
    const parsed = parseTaskInput(text);
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

    lastParsed.current = parsed;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Save the create form's title without its keywords
        if (!task) {
          const parsed = parseTaskInput(form.getFieldValue("title"));
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
          const parsed = task ? null : parseTaskInput(field.state.value);
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
                  if (!task) applyParsed(e.target.value);
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
              className="col-span-2 sm:flex-1"
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
