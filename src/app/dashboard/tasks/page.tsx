import TaskManager from "@/components/tasks/TaskManager";

export default function TasksPage() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tasks</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600 sm:text-base">
        Manage your tasks here.
      </p>

      <TaskManager />
    </div>
  );
}
