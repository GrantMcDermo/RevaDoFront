import { Component } from '@angular/core';
import { TaskList } from '../task-list/task-list';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TaskList],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
