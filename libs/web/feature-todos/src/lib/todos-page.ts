import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CreateTodoSchema } from '@fullstack/schemas';
import { TodoStore } from '@fullstack/web/data-access';

@Component({
  selector: 'lib-todos-page',
  templateUrl: './todos-page.html',
  styleUrl: './todos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodosPage implements OnInit {
  protected readonly store = inject(TodoStore);

  protected readonly title = signal('');
  protected readonly touched = signal(false);

  /** The same Zod schema the API validates with, run on the client. */
  private readonly validation = computed(() =>
    CreateTodoSchema.safeParse({ title: this.title() }),
  );
  protected readonly titleError = computed(() => {
    const result = this.validation();
    return this.touched() && !result.success
      ? result.error.issues[0]?.message
      : null;
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
