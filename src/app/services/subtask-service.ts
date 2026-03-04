import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subtask } from '../models/subtask';

@Injectable({
  providedIn: 'root',
})
export class SubtaskService {
  private baseUrl = 'http://localhost:8080/subtasks';

  constructor(private http: HttpClient) {}

  getSubtasks(taskId: number) {
    return this.http.get<Subtask[]>(`${this.baseUrl}/task/${taskId}`);
  }

  createSubtask(taskId: number, subtask: Partial<Subtask>) {
    return this.http.post<Subtask>(`${this.baseUrl}/${taskId}`, subtask);
  }

  updateSubtask(id: number, subtask: Partial<Subtask>) {
    return this.http.put<Subtask>(`${this.baseUrl}/${id}`, subtask);
  }

  deleteSubtask(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
