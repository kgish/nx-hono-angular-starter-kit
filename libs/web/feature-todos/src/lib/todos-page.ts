import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CreateTodoSchema } from '@fullstack/schemas';
import { TodoStore } from '@fullstack/web/data-access';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'lib-todos-page',
  imports: [TranslatePipe],
  templateUrl: './todos-page.html',
  styleUrl: './todos-page.scss',
})
export class TodosPage implements OnInit {
  protected readonly store = inject(TodoStore);

  protected readonly title = signal('');
  protected readonly touched = signal(false);

  /** The same Zod schema the API validates with, run on the client. */
  private readonly validation = computed(() =>
    CreateTodoSchema.safeParse({ title: this.title() }),
  );
  /** The schema owns the rules; the issue code picks the translated message. */
  protected readonly titleError = computed(() => {
    const result = this.validation();
    if (!this.touched() || result.success) return null;
    const issue = result.error.issues[0];
    switch (issue?.code) {
      case 'too_small':
        return { key: 'todos.errors.titleRequired' };
      case 'too_big':
        return {
          key: 'todos.errors.titleTooLong',
          params: { max: Number(issue.maximum) },
        };
      default:
        return { key: 'todos.errors.titleInvalid' };
    }
  });

  ngOnInit(): void {
    void this.store.load();
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.touched.set(true);
    const result = this.validation();
    if (!result.success) return;
    await this.store.add(result.data.title);
    if (!this.store.error()) {
      this.title.set('');
      this.touched.set(false);
    }
  }
}
