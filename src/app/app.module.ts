import {NgModule} from '@angular/core';
import {CommonModule, DatePipe, LowerCasePipe} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {SharedModule} from './shared/shared.module';
import {AppRoutingModule} from './app.routing';
import {AuthenticationService} from './services/authentication.service';
import {CanActivateViaAuthGuard} from './services/can-activate-auth-guard.service';
import {NavigationService} from './services/navigation.service';
import {ResourceService} from './services/resource.service';
import {CanActivateViaPubGuard} from './services/can-activate-pub-guard.service';
import {AireTopMenuComponent} from './shared/topmenu/topmenu.component';
import {AireFooterComponent} from './shared/footer/footer.component';
import {ReusableComponentsModule} from './shared/reusablecomponents/reusable-components.module';
import {ServiceProviderService} from './services/service-provider.service';
import {ComparisonService} from './services/comparison.service';
import {SearchAireComponent} from './pages/search/search.aire.component';
import {CookieLawModule} from './shared/reusablecomponents/cookie-law/cookie-law.module';
import {HomeAireComponent} from './pages/home/home.aire.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {ProviderModule} from './pages/provider/provider.module';
import {MatomoModule} from 'ngx-matomo';
import {HighchartsChartModule} from 'highcharts-angular';
import {environment} from '../environments/environment';
import {PortfolioItemComponent} from './pages/landingpages/portfolio/portfolio-item.component';
import {UserItemComponent} from './pages/landingpages/user/user-item.component';
import {DataSharingService} from './services/data-sharing.service';
import {AuthenticationInterceptor} from './services/authentication-interceptor';
import {FormsComponent} from './pages/forms/forms.component';
import {CatalogueUiModule} from '../catalogue-ui/catalogue-ui.module';
import {DatasourceSearchComponent} from './pages/search/datasources-search/datasourceSearch.component';
import {Datasource} from './pages/landingpages/datasource/datasource';
import { ServiceWorkerModule } from '@angular/service-worker';
import {UserService} from './services/user.service';


declare var require: any;

@NgModule({
  declarations: [
    AppComponent,
    HomeAireComponent,
    SearchAireComponent,
    DatasourceSearchComponent,
    Datasource,
    PortfolioItemComponent,
    UserItemComponent,
    // ServiceLandingPageComponent,
    AireTopMenuComponent,
    AireFooterComponent,
    FormsComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableComponentsModule,
    SharedModule,
    ProviderModule,
    HighchartsChartModule,
    CookieLawModule,
    NgSelectModule,
    MatomoModule.forRoot({
      scriptUrl: environment.MATOMO_URL + 'matomo.js',
      trackers: [
        {
          trackerUrl: environment.MATOMO_URL + 'matomo.php',
          siteId: environment.MATOMO_SITE
        }
      ],
      routeTracking: {
        enable: true
      }
    }),
    CatalogueUiModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    AuthenticationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    },
    ComparisonService,
    CanActivateViaAuthGuard,
    CanActivateViaPubGuard,
    ResourceService,
    UserService,
    ServiceProviderService,
    DataSharingService,
    NavigationService,
    DatePipe
  ],
  exports: [
    AireFooterComponent,
    AireTopMenuComponent,
    LowerCasePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
