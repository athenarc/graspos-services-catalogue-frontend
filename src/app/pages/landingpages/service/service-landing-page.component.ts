import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {Indicator, Measurement, ProviderBundle, RichService, Type, Vocabulary} from '../../../domain/eic-model';
import {AuthenticationService} from '../../../services/authentication.service';
import {NavigationService} from '../../../services/navigation.service';
import {ResourceService} from '../../../services/resource.service';
import {UserService} from '../../../services/user.service';
import {ServiceProviderService} from '../../../services/service-provider.service';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {flatMap} from 'rxjs/operators';
import {zip} from 'rxjs/internal/observable/zip';
import {EmailService} from '../../../services/email.service';
import {Paging} from '../../../domain/paging';

declare var UIkit: any;

@Component({
  selector: 'app-service-landing-page',
  templateUrl: './service-landing-page.component.html',
  styleUrls: ['../landing-page.component.css']
})
export class ServiceLandingPageComponent implements OnInit, OnDestroy {

  services: RichService[] = [];
  public richService: RichService;
  public errorMessage: string;
  public EU: string[];
  public WW: string[];
  public measurements: Paging<Measurement>;
  public indicators: Paging<Indicator>;
  public indicatorDesc = '';
  public serviceId;
  // public idArray: string[] = [];
  private sub: Subscription;

  weights: string[] = ['EU', 'WW'];
  serviceMapOptions: any = null;
  myProviders: ProviderBundle[] = [];

  formError = '';
  showForm = false;
  canEditService = false;
  placesVocIdArray: string[] = [];
  places: Vocabulary[] = null;
  newMeasurementForm: FormGroup;

  measurementForm = {
    indicatorId: ['', Validators.required],
    serviceId: ['', Validators.required],
    time: ['', Validators.required],
    locations: this.fb.array([
      this.fb.control('', Validators.required)
    ], Validators.required),
    valueIsRange: ['false', Validators.required],
    value: ['', Validators.required],
    rangeValue: this.fb.group({
      fromValue: ['', Validators.required],
      toValue: ['', Validators.required]
    })
  };

  constructor(public route: ActivatedRoute,
              public router: NavigationService,
              public resourceService: ResourceService,
              public authenticationService: AuthenticationService,
              public userService: UserService,
              private fb: FormBuilder,
              private providerService: ServiceProviderService,
              public emailService: EmailService) {
  }

  ngOnInit() {
    this.canEditService = false;

    if (this.authenticationService.isLoggedIn()) {
      this.sub = this.route.params.subscribe(params => {
        zip(
          this.resourceService.getEU(),
          this.resourceService.getWW(),
          // this.resourceService.getSelectedServices([params["id"]]),
          this.resourceService.getRichService(params['id'], params['version']),
          this.providerService.getMyServiceProviders(),
          this.resourceService.getLatestServiceMeasurement(params['id'])
          // this.resourceService.recordEvent(params["id"], "INTERNAL"),
        ).subscribe(suc => {
            this.EU = <string[]>suc[0];
            this.WW = <string[]>suc[1];
            this.richService = <RichService>suc[2];
            this.myProviders = suc[3];
            this.measurements = suc[4];
            this.indicators = <Paging<Indicator>>suc[5];
            this.serviceId = params['id'];
            this.getIndicatorIds();
            this.getLocations();
            this.router.breadcrumbs = this.richService.service.name;
            this.setCountriesForService(this.richService.service.geographicalAvailabilities);
            this.newMeasurementForm = this.fb.group(this.measurementForm);
            this.newMeasurementForm.get('locations').disable();
            this.newMeasurementForm.get('time').disable();
            this.newMeasurementForm.get('rangeValue').disable();
            this.newMeasurementForm.get('serviceId').setValue(params['id'], params['version']);

            /* check if the current user can edit the service */
            this.canEditService = this.myProviders.some(p => this.richService.service.resourceProviders.some(x => x === p.id));

            const serviceIDs = (this.richService.service.requiredResources || []).concat(this.richService.service.relatedResources || [])
              .filter((e, i, a) => a.indexOf(e) === i && e !== '');
            if (serviceIDs.length > 0) {
              this.resourceService.getSelectedServices(serviceIDs).subscribe(
                services => this.services = services,
                err => {
                  console.log(err.error);
                  this.errorMessage = err.error;
                });
            }
          },
          err => {
            if (err.status === 404) {
              this.router.go('/404');
            }
            this.errorMessage = 'An error occurred while retrieving data for this service. ' + err.error;
          });
      });
    } else {
      this.sub = this.route.params.subscribe(params => {
        zip(
          this.resourceService.getEU(),
          this.resourceService.getWW(),
          this.resourceService.getRichService(params['id']),
          this.resourceService.getLatestServiceMeasurement(params['id'])
          // this.resourceService.recordEvent(params["id"], "INTERNAL"),
        ).subscribe(suc => {
            this.EU = <string[]>suc[0];
            this.WW = <string[]>suc[1];
            this.richService = <RichService>suc[2];
            this.measurements = suc[3];
            this.getIndicatorIds();
            this.router.breadcrumbs = this.richService.service.name;
            this.setCountriesForService(this.richService.service.geographicalAvailabilities);

            const serviceIDs = (this.richService.service.requiredResources || []).concat(this.richService.service.relatedResources || [])
              .filter((e, i, a) => a.indexOf(e) === i && e !== '');
            if (serviceIDs.length > 0) {
              this.resourceService.getSelectedServices(serviceIDs)
                .subscribe(services => this.services = services,
                  err => {
                    console.log(err.error);
                    this.errorMessage = err.error;
                  });
            }
          },
          err => {
            this.errorMessage = 'An error occurred while retrieving data for this service. ' + err.error;
          });
      });
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  setCountriesForService(data: any) {
    if (this.richService) {
      const places = this.resourceService.expandRegion(JSON.parse(JSON.stringify(data || [])), this.EU, this.WW);

      let map = 'custom/europe';
      data.forEach(function (element) {
        if (element === 'WW') {
          map = 'custom/world-highres2';
        }
      });

      this.serviceMapOptions = {
        chart: {
          map: map,
          // map: 'custom/europe',
          // borderWidth: 1
        },
        title: {
          text: 'Countries serviced by ' + this.richService.service.name
        },
        // subtitle: {
        //     text: 'Demo of drawing all areas in the map, only highlighting partial data'
        // },
        legend: {
          enabled: false
        },
        series: [{
          name: 'Country',
          data: places.map(e => e.toLowerCase()).map(e => [e, 1]),
          dataLabels: {
            enabled: true,
            color: '#FFFFFF',
            formatter: function () {
              if (this.point.value) {
                return this.point.name;
              }
            }
          },
          tooltip: {
            headerFormat: '',
            pointFormat: '{point.name}'
          }
        }]
      };
    }
  }

  addToFavourites() {
    this.userService.addFavourite(this.richService.service.id, !this.richService.isFavourite).pipe(
      flatMap(e => this.resourceService.getSelectedServices([e.service])))
      .subscribe(
        res => {
          Object.assign(this.richService, res[0]);
        },
        err => {
          this.errorMessage = 'Could not add service to favourites. ' + err.error;
        }
      );
  }

  rateService(rating: number) {
    this.userService.rateService(this.richService.service.id, rating).pipe(
      flatMap(e => this.resourceService.getSelectedServices([e.service])))
      .subscribe(
        res => {
          Object.assign(this.richService, res[0]);
        },
        err => {
          this.errorMessage = 'Could not add a rating to this service. ' + err.error;
        }
      );
  }

  getPrettyService(id) {
    return (this.services || []).find(e => e.service.id === id);
    // || {id, name: 'Name not found!'};
  }

  handleError(error) {
    this.errorMessage = 'System error loading service (Server responded: ' + error + ')';
  }

  get locations() {
    return this.newMeasurementForm.get('locations') as FormArray;
  }

  pushToLocations() {
    this.locations.push(this.fb.control('', Validators.required));
  }

  removeFromLocations(i: number) {
    this.locations.removeAt(i);
  }

  showFormFields() {
    this.showForm = !this.showForm;
  }

  onIndicatorSelect(event) {
    this.newMeasurementForm.get('locations').disable();
    this.newMeasurementForm.get('time').disable();
    if (event.target.value != null) {
      for (let i = 0; i < this.indicators.results.length; i++) {
        if (this.indicators.results[i].id === event.target.value) {
          // console.log(this.indicators.results[i].dimensions);
          this.indicatorDesc = this.indicators.results[i].description;
          for (let j = 0; j < this.indicators.results[i].dimensions.length; j++) {
            // console.log(this.indicators.results[i].dimensions[j]);
            this.newMeasurementForm.get(this.indicators.results[i].dimensions[j]).enable();
          }
          return;
        }
      }
      this.indicatorDesc = '';
    }
  }

  setUnit(indicatorId: string): string {
    for (let i = 0; this.indicators.results.length; i++) {
      if (this.indicators.results[i].id === indicatorId) {
        return this.indicators.results[i].unitName;
      }
    }
    return '';
  }

  getIndicatorName(id: string): string {
    for (let i = 0; i < this.indicators.results.length; i++) {
      if (this.indicators.results[i].id === id) {
        return this.indicators.results[i].name;
      }
    }
  }

  getIndicatorIds() {
    this.resourceService.getAllIndicators('indicator').subscribe(
      indicatorPage => this.indicators = indicatorPage,
      error => this.errorMessage = 'Could not retrieve Indicators from server. ' + error.error,
      () => {
        this.indicators.results.sort((a, b) => 0 - (a.id > b.id ? -1 : 1));
      }
    );
  }

  getLocations() {
    this.resourceService.getNewVocabulariesByType(Type.COUNTRY).subscribe(
      suc => {
        this.places = suc;
        this.placesVocIdArray = this.places.map(place => place.id);
      },
      err => {
        this.errorMessage = 'Could not retrieve Places from server. ' + err.error;
      }
    );
  }

  getPlace(placeId: string) {
    return this.places.find(value => value.id === placeId);
  }

  handleChange(event) {
    if (event.target.value === 'single') {
      this.newMeasurementForm.get('rangeValue').disable();
      this.newMeasurementForm.get('rangeValue.toValue').reset();
      this.newMeasurementForm.get('rangeValue.fromValue').reset();
      this.newMeasurementForm.get('value').enable();
      this.newMeasurementForm.get('valueIsRange').setValue('false');
    } else {
      this.newMeasurementForm.get('rangeValue').enable();
      this.newMeasurementForm.get('value').disable();
      this.newMeasurementForm.get('value').reset();
      this.newMeasurementForm.get('valueIsRange').setValue('true');
    }
  }

  submitMeasurement() {
    this.formError = '';
    this.newMeasurementForm.updateValueAndValidity();
    if (this.newMeasurementForm.valid) {
      this.resourceService.postMeasurement(this.newMeasurementForm.value).subscribe(
        res => {
        },
        err => this.formError = err.error,
        () => {
          this.resourceService.getLatestServiceMeasurement(this.newMeasurementForm.get('serviceId').value).subscribe(
            res => this.measurements = res,
            err => {
              this.errorMessage = 'An error occurred while retrieving measurements. ' + err.error;
            }
          );
          this.newMeasurementForm.get('indicatorId').setValue('');
          this.newMeasurementForm.get('indicatorId').markAsUntouched();
          this.newMeasurementForm.get('indicatorId').markAsPristine();
          this.newMeasurementForm.get('locations').disable();
          this.newMeasurementForm.get('time').disable();
          this.newMeasurementForm.get('value').setValue('');
          this.newMeasurementForm.get('value').reset();
          this.newMeasurementForm.get('rangeValue.fromValue').setValue('');
          this.newMeasurementForm.get('rangeValue.fromValue').reset();
          this.newMeasurementForm.get('rangeValue.toValue').setValue('');
          this.newMeasurementForm.get('rangeValue.toValue').reset();
          while (this.locations.length > 0) {
            this.removeFromLocations(0);
          }
          this.pushToLocations();
          this.showFormFields();
          UIkit.modal('#add-measurement').hide();
        }
      );
      // console.log(this.newMeasurementForm.value);
    } else {
      for (const i in this.newMeasurementForm.controls) {
        this.newMeasurementForm.controls[i].markAsDirty();
        this.newMeasurementForm.controls[i].updateValueAndValidity();
        // console.log(this.newMeasurementForm.controls[i]);
      }
      for (const i in this.locations.controls) {
        this.locations.controls[i].markAsDirty();
        this.locations.controls[i].updateValueAndValidity();
      }
      this.newMeasurementForm.controls['rangeValue'].get('toValue').markAsDirty();
      this.newMeasurementForm.controls['rangeValue'].get('toValue').updateValueAndValidity();
      this.newMeasurementForm.controls['rangeValue'].get('fromValue').markAsDirty();
      this.newMeasurementForm.controls['rangeValue'].get('fromValue').updateValueAndValidity();
      this.formError = 'Please fill the required fields.';
    }
  }
}
