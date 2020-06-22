import {Component, OnInit} from '@angular/core';
import {ResourceService} from '../../services/resource.service';
import {ServiceProviderService} from '../../services/service-provider.service';
import {statusChangeMap, statusList} from '../../domain/service-provider-status-list';
import {ProviderBundle} from '../../domain/eic-model';
import {environment} from '../../../environments/environment';
import {mergeMap} from 'rxjs/operators';
import {AuthenticationService} from '../../services/authentication.service';
import {Router} from '@angular/router';

declare var UIkit: any;

@Component({
  selector: 'app-service-providers-list',
  templateUrl: './service-providers-list.component.html'
})
export class ServiceProvidersListComponent implements OnInit {
  url = environment.API_ENDPOINT;

  errorMessage: string;
  loadingMessage = '';

  providers: ProviderBundle[] = [];
  selectedProvider: ProviderBundle;
  newStatus: string;
  pushedApprove: boolean;

  total: number;
  from = 0;
  itemsPerPage = 15;
  currentPage = 1;
  pages: number[] = [];

  statusList = statusList;
  pendingFirstServicePerProvider: any[] = [];
  adminActionsMap = statusChangeMap;

  constructor(private resourceService: ResourceService,
              private serviceProviderService: ServiceProviderService,
              private authenticationService: AuthenticationService,
              private router: Router
  ) {
  }

  ngOnInit() {
    if (!this.authenticationService.getUserProperty('roles').some(x => x === 'ROLE_ADMIN')) {
      this.router.navigateByUrl('/home');
    } else {
      this.getProviders(this.from, this.itemsPerPage);
    }
  }

  getProviders(from: number, itemsPerPage: number) {
    this.providers = [];
    this.resourceService.getProviderBundles(`${from}`, `${itemsPerPage}`).subscribe(
      res => {
        this.providers = res['results'];
        this.total = res['total'];
        this.paginationInit();
      },
      err => {
        console.log(err);
        this.errorMessage = 'The list could not be retrieved';
      },
      () => {
        this.providers.forEach(
          p => {
            if ((p.status === 'pending service template approval') ||
              (p.status === 'rejected service template')) {
              this.serviceProviderService.getPendingServicesOfProvider(p.id).subscribe(
                res => {
                  if (res && (res.length > 0)) {
                    this.pendingFirstServicePerProvider.push({providerId: p.id, serviceId: res[0].id});
                  }
                }
              );
            }
          }
        );
      }
    );
  }

  approveStatusChange(provider: ProviderBundle) {
    this.selectedProvider = provider;
    UIkit.modal('#approveModal').show();
  }

  updateSelectedProvider() {
    if (this.selectedProvider && (this.selectedProvider.status !== 'approved')) {
      const i = this.statusList.indexOf(this.selectedProvider.status);
      let active = false;
      if (this.statusList[i + 1] === 'approved') {
        active = true;
      }
      const updatedFields = Object.assign({
        id: this.selectedProvider.id,
        status: this.statusList[i + 1],
        active: active
      });

      this.serviceProviderService.updateServiceProvider(updatedFields).pipe(
        mergeMap(res => this.serviceProviderService.getServiceProviderById(res.id)))
        .subscribe(
          res => {
            const i = this.providers.findIndex(p => p.id === res.id);
            if (i > -1) {
              Object.assign(this.providers[i], res);
            }
          },
          err => console.log(err),
          () => {
            UIkit.modal('#approveModal').hide();
            this.selectedProvider = null;
          }
        );
    }

  }

  showActionModal(provider: ProviderBundle, newStatus: string, pushedApprove: boolean) {
    this.selectedProvider = provider;
    this.newStatus = newStatus;
    this.pushedApprove = pushedApprove;
    if (this.selectedProvider) {
      UIkit.modal('#actionModal').show();
    }
  }

  statusChangeAction() {
    this.loadingMessage = ' ';
    const active = this.pushedApprove && (this.newStatus === 'approved');
    this.serviceProviderService.verifyServiceProvider(this.selectedProvider.id, active, this.adminActionsMap[this.newStatus].statusId)
      .subscribe(
        res => {
          /*this.providers = [];
          this.providers = res;*/
          // console.log(res);
          UIkit.modal('#actionModal').hide();
          this.getProviders(this.from, this.itemsPerPage);
        },
        err => {
          UIkit.modal('#actionModal').hide();
          this.loadingMessage = '';
          console.log(err);
        },
        () => {
          this.loadingMessage = '';
        }
      );
  }

  hasCreatedFirstService(id: string) {
    return this.pendingFirstServicePerProvider.some(x => x.providerId === id);
  }

  getLinkToFirstService(id: string) {
    return '/service/' + this.pendingFirstServicePerProvider.filter(x => x.providerId === id)[0].serviceId;
  }

  getLinkToEditFirstService(id: string) {
    return '/edit/' + this.pendingFirstServicePerProvider.filter(x => x.providerId === id)[0].serviceId;
  }

  paginationInit() {
    this.pages = [];
    for (let i = 0; i < Math.ceil(this.total / this.itemsPerPage); i++) {
      this.pages.push(i + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.from = (this.currentPage - 1) * this.itemsPerPage;
      this.getProviders(this.from, this.itemsPerPage);
    }
  }

  nextPage() {
    if (this.currentPage < Math.ceil(this.total / this.itemsPerPage)) {
      this.currentPage++;
      this.from = (this.currentPage - 1) * this.itemsPerPage;
      this.getProviders(this.from, this.itemsPerPage);
    }
  }

  goToPage(pageNum: number) {
    this.currentPage = pageNum;
    this.from = (this.currentPage - 1) * this.itemsPerPage;
    this.getProviders(this.from, this.itemsPerPage);
  }

  DownloadProvidersCSV() {
    window.open(this.url + '/exportToCSV/providers', '_blank');
  }

  DownloadServicesCSV() {
    window.open(this.url + '/exportToCSV/services', '_blank');
  }
}
