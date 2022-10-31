/**
 * App module
 */
// modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppErrorHandler } from './error.handler';
import { HttpClientModule } from '@angular/common/http';
import {
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    DateAdapter
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// components
import { AppComponent } from './app.component';
import { SchedulerLbeComponent } from './modules/scheduler/scheduler-lbe.component';

import { BryntumAngularSharedModule } from 'bryntum-angular-shared';
import { EventGridComponent } from './components/event-grid/event-grid.component';
import { EquipmentGridComponent } from './components/equipment-grid/equipment-grid.component';
import { ExtraGridComponent } from './components/extra-grid/extra-grid.component';
import { UserGridComponent } from './components/user-grid/user-grid.component';
import { CustomDateAdapter } from './services/custom-date-adapter';
import { AppRoutingModule } from './app.routing';
import { SchedulerLbeService } from './services/scheduler-lbe.service';

@NgModule({
    declarations: [
        AppComponent,
        SchedulerLbeComponent,
        EventGridComponent,
        EquipmentGridComponent,
        ExtraGridComponent,
        UserGridComponent,
    ],
    imports: [
        BrowserModule,
        BryntumAngularSharedModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule
    ],
    providers: [
        {provide: ErrorHandler, useClass: AppErrorHandler},
        {provide: DateAdapter, useClass: CustomDateAdapter},
        SchedulerLbeService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}


