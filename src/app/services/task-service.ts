import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Task } from '../models/task';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private baseUrl = 'http://localhost:8080/todo';

  constructor(private http: HttpClient) {}

  getTasks() {
    return this.http.get<Task[]>(this.baseUrl);
  }
  createTask(task: Partial<Task>) {
    return this.http.post<Task>(this.baseUrl, task);
  }

  updateTask(id: number, task: Partial<Task>) {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, task);
  }

  markTaskComplete(id: number){
    return this.http.patch<Task>(`${this.baseUrl}/${id}/complete`, {});
  }

  deleteTask(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
