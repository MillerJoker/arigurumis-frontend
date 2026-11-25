import { Component } from '@angular/core';
import { AboutComponent } from '../../../../shared/components/about.component';
import { CategoriesComponent } from '../../../../shared/components/categories.component';
import { ContactComponent } from '../../../../shared/components/contact.component';
import { FeaturedProductsComponent } from '../../../../shared/components/featured-products.component';
import { HeroComponent } from '../../../../shared/components/hero.component';
import { HowToOrderComponent } from '../../../../shared/components/how-to-order.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent, AboutComponent, CategoriesComponent,
    FeaturedProductsComponent, HowToOrderComponent, ContactComponent,
  ],
  template: `
    <app-hero />
    <app-about />
    <app-categories />
    <app-featured-products />
    <app-how-to-order />
    <app-contact />
  `,
})
export class HomeComponent {}