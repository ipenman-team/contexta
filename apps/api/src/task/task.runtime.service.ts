import { Injectable } from '@nestjs/common';
import { ReplaySubject, type Observable } from 'rxjs';
import type { TaskDto } from './task.dto';

@Injectable()
export class TaskRuntimeService {
  private readonly abortControllers = new Map<string, AbortController>();
  private taskStreams = new Map<
    string,
    { subject: ReplaySubject<TaskDto>; cleanupTimer?: NodeJS.Timeout }
  >();

  registerAbortController(taskId: string, controller: AbortController) {
    this.abortControllers.set(taskId, controller);
  }

  unregisterAbortController(taskId: string) {
    this.abortControllers.delete(taskId);
  }

  abort(taskId: string): boolean {
    const controller = this.abortControllers.get(taskId);
    if (!controller) return false;

    controller.abort();
    this.abortControllers.delete(taskId);
    return true;
  }

  private ensureStream(taskId: string) {
    const existing = this.taskStreams.get(taskId);
    if (existing) {
      if (existing.cleanupTimer) {
        clearTimeout(existing.cleanupTimer);
        existing.cleanupTimer = undefined;
      }
      return existing.subject;
    }

    const subject = new ReplaySubject<TaskDto>(1);
    this.taskStreams.set(taskId, { subject });
    return subject;
  }

  publish(task: TaskDto) {
    const subject = this.ensureStream(task.id);
    subject.next(task);

    // terminal task: allow clients to receive final state then cleanup
    if (task.status === 'SUCCEEDED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
      subject.complete();
      const entry = this.taskStreams.get(task.id);
      if (entry) {
        entry.cleanupTimer = setTimeout(() => {
          this.taskStreams.delete(task.id);
        }, 5 * 60 * 1000);
      }
    }
  }

  observe(taskId: string): Observable<TaskDto> {
    const subject = this.ensureStream(taskId);
    return subject.asObservable();
  }
}
