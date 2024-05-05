import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklistItem, ChecklistItem, EditChecklistItem, RemoveChecklistItem} from "../interfaces/checklist-item";
import {map, merge, Subject} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StorageService} from "./storage.service";
import {RemoveChecklist} from "../interfaces/checklist";
import {connect} from "ngxtension/connect";

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
    const nextState$ = merge(
      this.checklistItemsLoaded$.pipe(
        map(
          (checklistItems) => ({checklistItems, loaded: true})
        )
      )
    );

    connect(this.state)
      .with(nextState$)
      .with(this.add$, (state, checklistItem) => ({
        checklistItems: [
          ...state.checklistItems,
          {
            ...checklistItem.item,
            id: Date.now().toString(),
            checklistId: checklistItem.checklistId,
            checked: false
          }
        ],
      })).with(this.update$, (state, update) => ({
      checklistItems: state.checklistItems.map((item) => item.id === update.id ? {...item, title: update.data.title} : item)
    }))
      .with(this.delete$, (state, id) => ({
        checklistItems: state.checklistItems.filter((item) => item.id !== id)
      }))
      .with(this.toggle$, (state, checklistItemId) => ({
        checklistItems: state.checklistItems.map(
          (item) => item.id === checklistItemId ? {...item, checked: !item.checked} : item
        )
      }))
      .with(this.reset$, (state, checklistId) => ({
        checklistItems: state.checklistItems.map(
          (item) => item.checklistId === checklistId ? {...item, checked: false} : item
        )
      }))
      .with(this.checklistRemoved$, (state, checklistId) => ({
        checklistItems: state.checklistItems.filter(
          (item) => item.checklistId !== checklistId
        )
      }));

    //EFFECTS for storage
    effect(() => {
      if (this.loaded()){
        this.storageService.saveChecklistItems(this.checklistItems());
      }
    })
  }
}
