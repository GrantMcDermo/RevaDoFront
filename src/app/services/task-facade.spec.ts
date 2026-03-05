import { TestBed } from '@angular/core/testing';

import { TaskFacade } from './task-facade';

describe('TaskFacade', () => {
  let service: TaskFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
