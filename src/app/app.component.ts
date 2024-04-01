import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ],
  template: `
    <router-outlet />
  `,
  styles: [],
})
export class AppComponent {
  title = 'angularstart-quicklists';
  constructor(private pageTitle: Title) {
    pageTitle.setTitle(this.title);
  }
}
