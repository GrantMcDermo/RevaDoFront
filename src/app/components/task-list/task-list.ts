import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task-service';

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

  editingTaskId: number | null = null;
  editTitle = '';
  editDescription = '';

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks = tasks;
    });
  }

  createTask(form: NgForm) {
    if (form.invalid) return;
    this.taskService
      .createTask({
        title: this.newTitle,
        description: this.newDescription,
        completed: false
      })
      .subscribe({
        next: (task) =>{
          this.tasks.push(task);
          form.resetForm();
        },
        error: (err) => console.error(err)
      });
  }

  startEdit(task: Task) {
    this.editingTaskId = task.id;
    this.editTitle = task.title;
    this.editDescription = task.description;
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editTitle = '';
    this.editDescription = '';
  }

  saveEdit(task: Task) {
    this.taskService
      .updateTask(task.id, {
        title: this.editTitle,
        description: this.editDescription,
      })
      .subscribe(() => {
        this.cancelEdit();
        this.loadTasks();
      });
  }

  toggleComplete(task: Task) {
    this.taskService
      .markTaskComplete(task.id).subscribe(updatedTask => {
        const index = this.tasks.findIndex(t => t.id === task.id);
        this.tasks[index] = updatedTask;
      });
  }
  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe(() => this.loadTasks());
  }
}
