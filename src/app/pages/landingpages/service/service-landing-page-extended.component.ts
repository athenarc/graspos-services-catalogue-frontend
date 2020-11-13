import {Component, OnInit} from '@angular/core';
import {ServiceLandingPageComponent} from 'src/lib/pages/landingpages/service/service-landing-page.component';

@Component({
  selector: 'app-landing-page',
  templateUrl: 'service-landing-page.component.html',
  styleUrls: ['../landing-page.component.css']
})

export class ServiceLandingPageExtendedComponent extends ServiceLandingPageComponent implements OnInit {
  canAddOrEditService = false;

  ngOnInit() {
    this.canAddOrEditService = false;
    super.ngOnInit();
    if (this.myProviders && this.myProviders.length > 0) {
      this.canAddOrEditService = this.myProviders.some( p => this.richService.service.resourceProviders.some(x => x === p.id) ); //TODO: recheck resourceProviders
    }
  }
}
