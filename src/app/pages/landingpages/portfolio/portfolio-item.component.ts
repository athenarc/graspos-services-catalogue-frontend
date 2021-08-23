import {Component, OnInit} from '@angular/core';
import {ResourceService} from '../../../../lib/services/resource.service';
import {ActivatedRoute} from '@angular/router';
import {Vocabulary} from '../../../../lib/domain/eic-model';


@Component({
  selector: 'app-portfolio-item',
  templateUrl: './portfolio-item.component.html',
})
export class PortfolioItemComponent implements OnInit{

  response: Map<string, Object[]>;
  services: Map<string, Object[]>;
  portfolioVoc: Vocabulary;
  portfolioName: string;

  constructor(protected resourceService: ResourceService, protected route: ActivatedRoute) {
  }

  ngOnInit() {
    this.portfolioName = this.route.snapshot.paramMap.get('name');
    this.resourceService.getNewVocabulariesByType('PORTFOLIOS').subscribe(
      res => {
        for (const [key, value] of Object.entries(res)) {
          console.log(`${key}: ${value}`);
          if (value.name === this.portfolioName)
            this.portfolioVoc = value;
        }
      },
      error => {console.log(error)},
      () => {
        console.log(this.portfolioVoc);
      }
    );
    this.resourceService.getServicesByVocabularyTypeAndId('Portfolios', this.portfolioName)
      .subscribe( res => {
          this.response = res;
          console.log(res);
          for (const [key, value] of Object.entries(res)) {
            console.log(`${key}: ${value}`);
            this.services = value;
          }
          // this.services = res;
        },
        error => console.log(error),
        () => {
        console.log(this.response);
        console.log(this.services);
      }
      );
  }
}
