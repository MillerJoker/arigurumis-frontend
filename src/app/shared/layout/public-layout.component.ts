import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '../components/toast.component';
import { WhatsappButtonComponent } from '../components/whatsapp-button.component';
import { FooterComponent } from './footer.component';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WhatsappButtonComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="min-h-[60vh]"><router-outlet /></main>
    <app-footer />
    <app-whatsapp-button />
    <app-toast />
  `,
})
export class PublicLayoutComponent {}