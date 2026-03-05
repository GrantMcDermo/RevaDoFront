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

  updateTask(id: string, task: Partial<Task>) {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, task);
  }

  markTaskComplete(id: string){
    return this.http.patch<Task>(`${this.baseUrl}/${id}/complete`, {});
  }

  deleteTask(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
