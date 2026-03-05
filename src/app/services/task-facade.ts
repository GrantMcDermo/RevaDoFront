import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, finalize, tap } from 'rxjs';
import { Task } from '../models/task';
import { TaskService } from './task-service';
import { SubtaskService } from './subtask-service';
import { Subtask } from '../models/subtask';

@Injectable({
  providedIn: 'root',
})
export class TaskFacade {
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this._tasks$.asObservable();

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  constructor(
    private taskApi: TaskService,
    private subtaskApi: SubtaskService,
  ) {}

  loadTasks() {
    this._loading$.next(true);
    return this.taskApi.getTasks().pipe(
      tap((tasks) => this._tasks$.next(tasks)),
      finalize(() => this._loading$.next(false)),
      catchError((err) => {
        console.error('Load task failed:', err);
        this._loading$.next(false);
        return EMPTY;
      }),
    );
  }

  private patchTask(taskId: string, patch: (t: Task) => Task) {
    const current = this._tasks$.value;
    this._tasks$.next(current.map((t) => (t.id === taskId ? patch(t) : t)));
  }

  private patchSubtask(subtaskId: string, patch: (s: Subtask) => Subtask) {
    const current = this._tasks$.value;
    this._tasks$.next(
      current.map((t) => ({
        ...t,
        subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? patch(s) : s)),
      })),
    );
  }

  createTask(title: string, description: string) {
    // optional: optimistic add could be done here too, but easiest is just reload
    return this.taskApi.createTask({ title, description }).pipe(
      tap(() => {}),
      // reload to keep truth
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Create task failed', err);
        return EMPTY;
      }),
    );
  }

  updateTask(taskId: string, title: string, description: string) {
    // optimistic
    this.patchTask(taskId, (t) => ({ ...t, title, description }));

    return this.taskApi.updateTask(taskId, { title, description }).pipe(
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Update task failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  toggleTaskComplete(taskId: string) {
    // optimistic
    this.patchTask(taskId, (t) => ({ ...t, completed: !t.completed }));

    return this.taskApi.markTaskComplete(taskId).pipe(
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Toggle task failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  deleteTask(taskId: string) {
    // optimistic remove
    this._tasks$.next(this._tasks$.value.filter((t) => t.id !== taskId));

    return this.taskApi.deleteTask(taskId).pipe(
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Delete task failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  createSubtask(taskId: string, title: string, description: string) {
    return this.subtaskApi.createSubtask(taskId, { title, description }).pipe(
      tap((created) => {
        // update UI immediately from returned DTO (real UUID)
        this.patchTask(taskId, (t) => ({
          ...t,
          subtasks: [...(t.subtasks ?? []), created],
        }));
      }),
      // optional reload if backend has extra logic
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Create subtask failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  updateSubtask(subtaskId: string, title: string, description: string) {
    // optimistic
    this.patchSubtask(subtaskId, (s) => ({ ...s, title, description }));

    return this.subtaskApi.updateSubtask(subtaskId, { title, description }).pipe(
      tap((updated) => this.patchSubtask(subtaskId, () => updated)),
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Update subtask failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  toggleSubtaskComplete(subtaskId: string) {
    // optimistic
    this.patchSubtask(subtaskId, (s) => ({ ...s, completed: !s.completed }));

    return this.subtaskApi.markComplete(subtaskId).pipe(
      tap((updated) => this.patchSubtask(subtaskId, () => updated)),
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Toggle subtask failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }

  deleteSubtask(subtaskId: string) {
    // optimistic nested remove
    const current = this._tasks$.value;
    this._tasks$.next(
      current.map((t) => ({
        ...t,
        subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId),
      })),
    );

    return this.subtaskApi.deleteSubtask(subtaskId).pipe(
      tap(() => this.loadTasks().subscribe()),
      catchError((err) => {
        console.error('Delete subtask failed', err);
        this.loadTasks().subscribe();
        return EMPTY;
      }),
    );
  }
}
