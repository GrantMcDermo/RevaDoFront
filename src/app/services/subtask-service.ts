import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subtask } from '../models/subtask';

@Injectable({
  providedIn: 'root',
})
export class SubtaskService {
  private baseUrl = 'http://localhost:8080/subtasks';

  constructor(private http: HttpClient) {}

  createSubtask(taskId: string, payload: { title: string; description: string }) {
    return this.http.post<Subtask>(`${this.baseUrl}/task/${taskId}`, payload);
  }

  updateSubtask(id: string, subtask: Partial<Subtask>) {
    return this.http.put<Subtask>(`${this.baseUrl}/${id}`, subtask);
  }

  markComplete(id: string) {
    return this.http.patch<Subtask>(`${this.baseUrl}/${id}/complete`, {});
  }

  deleteSubtask(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
