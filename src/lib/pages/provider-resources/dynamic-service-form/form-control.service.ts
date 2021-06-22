import {Injectable} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {FormModel, UiVocabulary} from '../../../domain/dynamic-form-model';
import {urlAsyncValidator, URLValidator} from '../../../shared/validators/generic.validator';
import {ServiceProviderService} from '../../../services/service-provider.service';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {AuthenticationService} from '../../../services/authentication.service';
import {RichService} from '../../../domain/eic-model';

@Injectable()
export class FormControlService {
  constructor(public http: HttpClient,
              public authenticationService: AuthenticationService,
              private serviceProviderService: ServiceProviderService) { }

  base = environment.API_ENDPOINT;
  private options = {withCredentials: true};

  getFormModel() {
    return this.http.get<FormModel[]>(this.base + '/ui/form/model');
  }

  getUiVocabularies() {
    return this.http.get<Map<string, UiVocabulary[]>>(this.base + `/ui/vocabularies`);
  }

  getDynamicService(id: string) {
    return this.http.get(this.base + `/infraService/dynamic/${id}/`, this.options);
  }

  toFormGroup(form: FormModel[], checkImmutable: boolean) {
    const group: any = {};
    form.forEach(groups => {
      groups.fields.sort((a, b) => a.field.form.order - b.field.form.order)
      groups.fields.forEach(formField => {
        if (formField.field.form.immutable === checkImmutable) {
          if (formField.field.multiplicity) {
            if (formField.field.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this.serviceProviderService))])
                : new FormArray([new FormControl('', URLValidator, urlAsyncValidator(this.serviceProviderService))]);
            } else if (formField.field.type === 'composite') {
              group[formField.field.name] = formField.field.form.mandatory ? new FormArray([], Validators.required)
                : new FormArray([]);
              const subGroup: any = {};
              formField.subFieldGroups.forEach(subField => {
                subGroup[subField.field.name] = subField.field.form.mandatory ?
                  new FormControl('', Validators.required)
                  : new FormControl('');
                if (subField.field.form.dependsOn !== null) {
                  subGroup[subField.field.name].disable();
                }
              });
              group[formField.field.name].push(new FormGroup(subGroup));
            } else {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl('', Validators.required)])
                : new FormArray([new FormControl('')]);
            }
          } else {
            if (formField.field.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this.serviceProviderService))
                : new FormControl('', URLValidator, urlAsyncValidator(this.serviceProviderService));
            } else if (formField.field.type === 'composite') {
              const subGroup: any = {};
              formField.subFieldGroups.forEach(subField => {
                subGroup[subField.field.name] = subField.field.form.mandatory ?
                  new FormControl('', Validators.required)
                  : new FormControl('');
                if (subField.field.form.dependsOn !== null) {
                  subGroup[subField.field.name].disable();
                }
              });
              group[formField.field.name] = new FormGroup(subGroup);
            } else {
              group[formField.field.name] = formField.field.form.mandatory ? new FormControl('', Validators.required)
                : new FormControl('');
            }
          }
        }
      });
    });
    return new FormGroup(group);
  }

}
