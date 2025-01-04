import { Component, OnInit } from '@angular/core';
import { ProgressSectionComponent } from "./progress-section/progress-section.component";
import { TasksSectionComponent } from "./tasks-section/tasks-section.component";
import { StatsSectionComponent } from "./stats-section/stats-section.component";
import { ResourcesSectionComponent } from "./resources-section/resources-section.component";

@Component({
  selector: 'app-formation-commercial',
  templateUrl: './formation-commercial.component.html',
  imports: [ProgressSectionComponent, TasksSectionComponent, StatsSectionComponent, ResourcesSectionComponent]
})
export class FormationCommercialComponent implements OnInit {
  constructor() { }

  ngOnInit(): void { }
}
