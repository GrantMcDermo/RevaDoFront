import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Task } from '../../models/task';
import { AsyncPipe } from '@angular/common';
import { Subtask } from '../../models/subtask';
import { TaskFacade } from '../../services/task-facade';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList {
  tasks$!: Observable<Task[]>;

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

  constructor(private facade: TaskFacade) {}

  ngOnInit() {
    this.tasks$ = this.facade.tasks$;
    this.facade.loadTasks().subscribe();
  }

  createTask(form: NgForm) {
    if (form.invalid) return;
    this.facade.createTask(this.newTitle, this.newDescription).subscribe({
      next: () => form.resetForm(),
    })
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
    if (!title) return;

    this.facade.updateTask(task.id, title, this.editDescription).subscribe({
      next: () => this.cancelEdit()
    });
  }

  toggleComplete(task: Task) {
    this.facade.toggleTaskComplete(task.id).subscribe();
  }

  deleteTask(id: string) {
    this.facade.deleteTask(id).subscribe();
  }

  creatingSubtaskForTaskIds = new Set<string>();
  createSubtask(task: Task) {
    const title = (this.newSubtaskTitle[task.id] ?? '').trim();
    const description = this.newSubtaskDescription[task.id] ?? '';
    if (!title) return;
    this.facade.createSubtask(task.id, title, description).subscribe({
      next: () => {
        this.newSubtaskTitle[task.id] = '';
        this.newSubtaskDescription[task.id] = '';
      }
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

  saveEditSubtask(s: Subtask) {
    const title = this.editSubtaskTitle.trim();
    const description = this.editSubtaskDescription;
    if (!title) return;

    this.facade.updateSubtask(s.id, title, description).subscribe({
      next: () => this.cancelEditSubtask()
    });
  }
  completeSubtask(s: Subtask) {
    this.facade.toggleSubtaskComplete(s.id).subscribe();
  }
  deleteSubtask(id: string) {
    this.facade.deleteSubtask(id).subscribe();
  }
}
