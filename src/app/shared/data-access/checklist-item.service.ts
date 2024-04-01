import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklistItem, ChecklistItem, EditChecklistItem, RemoveChecklistItem} from "../interfaces/checklist-item";
import {Subject} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StorageService} from "./storage.service";
import {RemoveChecklist} from "../interfaces/checklist";

export interface ChecklistItemState {
  checklistItems: ChecklistItem[];
  loaded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistItemService {
  storageService = inject(StorageService);

  //state
  private state = signal<ChecklistItemState>({
    checklistItems: [],
    loaded: true,
  });

  //selectors
  checklistItems = computed(() => this.state().checklistItems);
  loaded = computed(() => this.state().loaded);

  //sources or actions
  add$ = new Subject<AddChecklistItem>();
  toggle$ = new Subject<RemoveChecklistItem>();
  reset$ = new Subject<RemoveChecklistItem>();
  update$ = new Subject<EditChecklistItem>();
  delete$ = new Subject<RemoveChecklistItem>();
  private checklistItemsLoaded$ = this.storageService.loadChecklistItems();
  checklistRemoved$ = new Subject<RemoveChecklist>();

  constructor() {
    //REDUCERS
    //add$
    this.add$.pipe(takeUntilDestroyed()).subscribe(
      (checklistItem) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: [...state.checklistItems,
            {
              ...checklistItem.item,
              id: Date.now().toString(),
              checklistId: checklistItem.checklistId,
              checked: false,
            }
          ]
        })
      )
    );
    //toggle$
    this.toggle$.pipe(takeUntilDestroyed()).subscribe(
      (checklistItemId) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: state.checklistItems.map(
            (item) => item.id === checklistItemId ? {...item, checked: !item.checked} : item
          )
        })
      )
    );
    //reset$
    this.reset$.pipe(takeUntilDestroyed()).subscribe(
      (checklistId) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: state.checklistItems.map(
            (item) => item.checklistId === checklistId ? {...item, checked: false} : item
          )
        })
      )
    );
    //checklistItemsLoaded$
    this.checklistItemsLoaded$.pipe(takeUntilDestroyed()).subscribe(
      (checklistItems) => this.state.update(
        (state) => ({
          ...state,
          checklistItems,
          loaded: true
        })
      )
    );
    //update$
    this.update$.pipe(takeUntilDestroyed()).subscribe(
      (checklistItem) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: state.checklistItems.map(
            (item) => item.id === checklistItem.id ? {...item, title: checklistItem.data.title} : item
          )
        })
      )
    );
    //delete$
    this.delete$.pipe(takeUntilDestroyed()).subscribe(
      (checklistItemId) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: state.checklistItems.filter(
            (item) => item.id !== checklistItemId
          )
        })
      )
    );
    //checklistRemoved$
    this.checklistRemoved$.pipe(takeUntilDestroyed()).subscribe(
      (checklistId) => this.state.update(
        (state) => ({
          ...state,
          checklistItems: state.checklistItems.filter(
            (item) => item.id !== checklistId
          )
        })
      )
    )
    //EFFECTS for storage
    effect(() => {
      if (this.loaded()){
        this.storageService.saveChecklistItems(this.checklistItems());
      }
    })
  }
}
