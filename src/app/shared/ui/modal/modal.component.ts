import {Component, ContentChild, inject, Input, TemplateRef} from '@angular/core';
import {Dialog} from "@angular/cdk/dialog";

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  template: `
    <div></div>
  `,
  styles: ``
})
export class ModalComponent {
  dialog = inject(Dialog);

  @Input() set isOpen(value: boolean){
    if(value){
      this.dialog.open(this.template, { panelClass: 'dialog-container' });
    } else {
      this.dialog.closeAll();
    }
  }

  @ContentChild(TemplateRef, {static: false}) template!: TemplateRef<any>;
}
