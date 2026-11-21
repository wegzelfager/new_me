import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeroComponent } from './hero/hero.component';
import { WorkComponent } from './work/work.component';
import { MergeTransitionComponent } from './merge-transition/merge-transition.component';
import { StackComponent } from './stack/stack.component';
import { ExperienceComponent } from './experience/experience.component';
import { CertificatesComponent } from './certificates/certificates.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
  declarations: [
    AppComponent,
    HeroComponent,
    WorkComponent,
    MergeTransitionComponent,
    StackComponent,
    ExperienceComponent,
    CertificatesComponent,
    ContactComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
