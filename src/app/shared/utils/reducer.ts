import {Observable} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export function reducer<T>(
  source$: Observable<T>,
  next: (value: T) => void,
  error?: (err: any) => void
){
  source$.pipe(takeUntilDestroyed()).subscribe({
    next,
    error: error ? error : (err) => console.error(err),
  })
}
