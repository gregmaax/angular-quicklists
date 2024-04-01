import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklist, Checklist, EditChecklist} from "../interfaces/checklist";
import {Subject} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StorageService} from "./storage.service";
import {ChecklistItemService} from "./checklist-item.service";
import {EditChecklistItem} from "../interfaces/checklist-item";

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
  private checklistLoaded$ = this.storageService.loadChecklists();
  edit$ = new Subject<EditChecklist>();
  delete$ = this.checklistItemService.checklistRemoved$;

  constructor() {
    //REDUCERS
    //add$
    this.add$.pipe(takeUntilDestroyed()).subscribe(
      (checklist) => this.state.update(
        (state) => ({
          ...state,
          checklists: [...state.checklists, this.addIdToChecklist(checklist)]
        })
      )
    );
    //checklistLoaded$
    this.checklistLoaded$.pipe(takeUntilDestroyed()).subscribe(
      {
        next: (checklists) => this.state.update(
          (state) => ({
            ...state,
            checklists,
            loaded: true
          })
        ),
        error: (err) => this.state.update((state) => ({...state, error: err}))
      }
    );
    //edit$
    this.edit$.pipe(takeUntilDestroyed()).subscribe(
      (checklistEdited) => this.state.update(
        (state) => ({
          ...state,
          checklists: state.checklists.map(
            (checklist) =>
              checklist.id === checklistEdited.id ? {...checklist, title: checklistEdited.data.title} : checklist
          )
        })
      )
    );
    //delete$
    this.delete$.pipe(takeUntilDestroyed()).subscribe(
      (checklistId) => this.state.update(
        (state) => ({
          ...state,
          checklists: state.checklists.filter(
            (checklist) => checklist.id !== checklistId
          )
        })
      )
    );
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
