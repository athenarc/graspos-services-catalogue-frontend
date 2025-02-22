import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ServiceLandingPageRouting} from './service-landing-page.routing';
import {ServiceLandingPageComponent} from './service-landing-page.component';
import {OverviewComponent} from './overview/overview.component';
import {PricingComponent} from './pricing/pricing.component';
import {ResourcesAndSupportComponent} from './resourcesAndSupport/resourcesAndSupport.component';
import {MiscellaneousComponent} from './miscellaneous/miscellaneous.component';
import {ChangeLogComponent} from './resourcesAndSupport/changeLog/change-log.component';
import {ReusableComponentsModule} from '../../../shared/reusablecomponents/reusable-components.module';

@NgModule({
  declarations: [
    ServiceLandingPageComponent,
    OverviewComponent,
    PricingComponent,
    ResourcesAndSupportComponent,
    MiscellaneousComponent,
    ChangeLogComponent
  ],
  imports: [
    CommonModule,
    ReusableComponentsModule,
    ServiceLandingPageRouting,
    FormsModule
  ],
})

export class ServiceLandingPageModule {}
