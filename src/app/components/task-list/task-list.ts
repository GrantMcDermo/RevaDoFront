import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task-service';
import { SubtaskService } from '../../services/subtask-service';
import { Subtask } from '../../models/subtask';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList {
  tasks: Task[] = [];

  newTitle = '';
  newDescription = '';

  editingTaskId = signal<string | null>(null);
  editTitle = '';
  editDescription = '';

  newSubtaskTitle: Record<string, string> = {};
  newSubtaskDescription: Record<string, string> = {};

  editingSubtaskId = signal<string | null>(null);
  editSubtaskTitle = '';
  editSubtaskDescription = '';

  constructor(
    private taskService: TaskService,
    private subtaskService: SubtaskService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.cdr.detectChanges(); // ✅ make list appear immediately
      },
      error: (err) => console.error('Load tasks failed:', err),
    });
  }

  createTask(form: NgForm) {
    if (form.invalid) return;
    this.taskService
      .createTask({
        title: this.newTitle,
        description: this.newDescription,
      })
      .subscribe({
        next: (task) => {
          this.tasks.push(task);
          form.resetForm();
        },
        error: (err) => console.error(err),
      });
  }

  startEdit(task: Task) {
    this.editingTaskId.set(task.id);
    this.editTitle = task.title;
    this.editDescription = task.description;
  }

  cancelEdit() {
    this.editingTaskId.set(null);
    this.editTitle = '';
    this.editDescription = '';
  }

  saveEdit(task: Task) {
    const title = this.editTitle.trim();
    const description = this.editDescription;

    if (!title) return;

    this.tasks = this.tasks.map((t) => (t.id === task.id ? { ...t, title, description } : t));

    this.taskService
      .updateTask(task.id, {
        title,
        description,
      })
      .subscribe({
        next: () => {
          this.cancelEdit();
          this.loadTasks();
        },
        error: (err) => {
          console.error('Save failed:', err);
          this.loadTasks();
        },
      });
  }

  toggleComplete(task: Task) {
    const previous = task.completed;
    this.tasks = this.tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t));
    this.taskService.markTaskComplete(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        console.error('Toggle failed:', err);
        this.tasks = this.tasks.map((t) => (t.id === task.id ? { ...t, completed: previous } : t));
        this.loadTasks();
      },
    });
  }
  deleteTask(id: string) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.loadTasks();
      },
    });
  }

  creatingSubtaskForTaskIds = new Set<string>();
  createSubtask(task: Task) {
    const title = (this.newSubtaskTitle[task.id] ?? '').trim();
    const description = this.newSubtaskDescription[task.id] ?? '';

    if (!title) return;

    if (this.creatingSubtaskForTaskIds.has(task.id)) return;
    this.creatingSubtaskForTaskIds.add(task.id);

    this.subtaskService
      .createSubtask(task.id, {
        title,
        description,
      })
      .subscribe({
        next: (created) => {
          this.tasks = this.tasks.map((t) =>
            t.id === task.id ? { ...t, subtasks: [...(t.subtasks ?? []), created] } : t,
          );
          this.newSubtaskTitle[task.id] = '';
          this.newSubtaskDescription[task.id] = '';
          this.creatingSubtaskForTaskIds.delete(task.id);
          this.cdr.detectChanges();
          //this.loadTasks();
        },
        error: (err) => {
          console.error('Create subtask failed:', err);
          this.creatingSubtaskForTaskIds.delete(task.id);
          this.loadTasks();
        },
      });
  }

  startEditSubtask(subtask: Subtask) {
    this.editingSubtaskId.set(subtask.id);
    this.editSubtaskTitle = subtask.title;
    this.editSubtaskDescription = subtask.description;
  }

  cancelEditSubtask() {
    this.editingSubtaskId.set(null);
    this.editSubtaskTitle = '';
    this.editSubtaskDescription = '';
  }

  saveEditSubtask(subtask: Subtask) {
    const title = this.editSubtaskTitle.trim();
    const description = this.editSubtaskDescription;

    if (!title) return;

    // Optimistic update:
    this.tasks = this.tasks.map((t) => ({
      ...t,
      subtasks: (t.subtasks ?? []).map((s) =>
        s.id === subtask.id ? { ...s, title, description } : s,
      ),
    }));

    this.cdr.detectChanges();

    this.subtaskService
      .updateSubtask(subtask.id, {
        title,
        description,
      })
      .subscribe({
        next: (updated) => {
          // If your endpoint returns the updated Subtask, prefer using it:
          this.tasks = this.tasks.map((t) => ({
            ...t,
            subtasks: (t.subtasks ?? []).map((s) => (s.id === updated.id ? updated : s)),
          }));

          this.cancelEditSubtask();

          this.cdr.detectChanges();

          // Optional: keep backend truth if there are side effects
          // this.loadTasks();
        },
        error: (err) => {
          console.error('Update subtask failed:', err);
          this.loadTasks();
          this.cdr.detectChanges();
        },
      });
  }
  completeSubtask(subtask: Subtask) {
    // optimistic toggle-like UI (if your endpoint only sets true, you can force true here)
    this.tasks = this.tasks.map((t) => ({
      ...t,
      subtasks: (t.subtasks ?? []).map((s) =>
        s.id === subtask.id ? { ...s, completed: !s.completed } : s,
      ),
    }));

    this.cdr.detectChanges();

    this.subtaskService.markComplete(subtask.id).subscribe({
      next: () => {
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Complete subtask failed:', err);
        this.loadTasks();
        this.cdr.detectChanges();
      },
    });
  }
  deleteSubtask(subtaskId: string) {
    if (subtaskId.startsWith('temp-')) {
      this.tasks = this.tasks.map((t) => ({
        ...t,
        subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId),
      }));
      return;
    }

    // optimistic remove
    this.tasks = this.tasks.map((t) => ({
      ...t,
      subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId),
    }));

    this.subtaskService.deleteSubtask(subtaskId).subscribe({
      next: () => this.loadTasks(),
      error: (err) => {
        console.error('Delete subtask failed:', err);
        this.loadTasks();
      },
    });
  }
}
