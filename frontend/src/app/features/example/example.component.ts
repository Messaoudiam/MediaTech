import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-example",
  template: `
    <div>
      <h1>{{ title }}</h1>
      <button (click)="onClick()">Cliquer</button>
    </div>
  `,
})
export class ExampleComponent implements OnInit {
  title = "Mon Exemple";

  ngOnInit(): void {
    // Équivalent à useEffect(() => {}, [])
  }

  onClick(): void {
    // Gestionnaire d'événement
  }
}
