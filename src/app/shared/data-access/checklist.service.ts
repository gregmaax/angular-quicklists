import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklist, Checklist, EditChecklist} from "../interfaces/checklist";
import {catchError, EMPTY, map, merge, Subject} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StorageService} from "./storage.service";
import {ChecklistItemService} from "./checklist-item.service";
import {EditChecklistItem} from "../interfaces/checklist-item";
import {reducer} from "../utils/reducer";
import {connect} from "ngxtension/connect";

export interface ChecklistState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}
@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  storageService = inject(StorageService);
  checklistItemService = inject(ChecklistItemService);

  //state
  private state = signal<ChecklistState>({
    checklists: [],
    loaded: false,
    error: null
  });

  //selectors
  checklists = computed(() => this.state().checklists);
  loaded = computed(() => this.state().loaded);

  //sources or actions
  add$ = new Subject<AddChecklist>();
  private checklistLoaded$ = this.storageService.loadChecklists().pipe(
    catchError((err) => {
      this.error$.next(err);
      return EMPTY;
    })
  );
  edit$ = new Subject<EditChecklist>();
  delete$ = this.checklistItemService.checklistRemoved$;
  private error$ = new Subject<string>();

  constructor() {
    //REDUCERS
    const nextState$ = merge(
      this.checklistLoaded$.pipe(
        map(
          (checklists) => ({checklists, loaded: true}))
        ),
        this.error$.pipe(map((error) => ({error})))
      );

    connect(this.state)
      .with(nextState$)
      .with(this.add$, (state, checklist) => ({
        checklists: [...state.checklists, this.addIdToChecklist(checklist)],
      }))
      .with(this.delete$, (state, id) => ({
        checklists: state.checklists.filter((checklist) => checklist.id !== id)
      }))
      .with(this.edit$, (state, update) => ({
        checklists: state.checklists.map(
          (checklist) => checklist.id === update.id ? {...checklist, title: update.data.title} : checklist)
      }));

    //EFFECTS
    effect(() => {
      if (this.loaded()){
        this.storageService.saveChecklists(this.checklists())
      }
    });
  }

  private addIdToChecklist(checklist: AddChecklist) {
    return {
      ...checklist,
      id: this.generateSlug(checklist.title),
    };
  }

  private generateSlug(title: string) {
    // NOTE: This is a simplistic slug generator and will not handle things like special characters.
    let slug = title.toLowerCase().replace(/\s+/g, '-');

    // Check if the slug already exists
    const matchingSlugs = this.checklists().find(
      (checklist) => checklist.id === slug
    );

    // If the title is already being used, add a string to make the slug unique
    if (matchingSlugs) {
      slug = slug + Date.now().toString();
    }

    return slug;
  }
}
