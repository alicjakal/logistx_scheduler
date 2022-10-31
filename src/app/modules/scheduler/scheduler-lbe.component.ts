/**
 * App Component script
 */
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SchedulerComponent } from 'bryntum-angular-shared';
import { ActivatedRoute, Params, Router } from '@angular/router';
import schedulerConfig from '../../schedulerConfig';
import * as moment from 'moment';

// UMD bundle is used to support IE11 browser. If you don't need it just use import {...} from 'bryntum-scheduler' instead
import {
    AjaxStore,
    AjaxStoreConfig,
    DateHelper,
    DomHelper,
    DragHelper,
    EventModel,
    Model,
    Rectangle,
    Toast,
    WidgetHelper,
    MessageDialog,
} from 'bryntum-scheduler/scheduler.umd.js';
import { EventGridComponent } from '../../components/event-grid/event-grid.component';
import { EquipmentGridComponent } from '../../components/equipment-grid/equipment-grid.component';
import { ExtraGridComponent } from '../../components/extra-grid/extra-grid.component';
import { HttpClient } from '@angular/common/http';
import { SchedulerLbeService } from '../../services/scheduler-lbe.service';
import set = Reflect.set;
import { UserGridComponent } from '../../components/user-grid/user-grid.component';
// const API_URL: string = window['baseLink'];
const API_URL: string = 'http://localhost:8163/main';
@Component({
    selector: 'app-root',
    templateUrl: './scheduler-lbe.component.html',
    styleUrls: ['./scheduler-lbe.component.scss']
})
export class SchedulerLbeComponent implements AfterViewInit {

    @Input() autoRescheduleTasks: boolean = false;

    @ViewChild(SchedulerComponent) scheduler: SchedulerComponent;
    @ViewChild(EventGridComponent) eventsGridComponent: EventGridComponent;
    @ViewChild('equipmentGrid') equipmentsGridComponent: EquipmentGridComponent;
    @ViewChild('extraGrid') extrasGridComponent: ExtraGridComponent;
    @ViewChild('userGrid') userGridComponent: UserGridComponent;
    @ViewChild('datePickerContainer') datePickerContainer: ElementRef;
    selectedUser = 1;
    selectedUserResource = null;
    schedulerConfig: any = schedulerConfig;
    startDate = new Date();
    endDate = new Date();
    events = [];
    users = [];

    constructor(
        private http: HttpClient,
        public route: ActivatedRoute,
        private router: Router,
        private service: SchedulerLbeService
    ) {
        this.selectedUser = this.getRouteParam('user_id') ? this.getRouteParam('user_id') * 1 : 1;
        const selectedDate = this.getRouteParam('date');
        this.startDate = selectedDate ? this.getMonday(new Date(selectedDate)) : this.getMonday(new Date());
        this.endDate = DateHelper.add(this.startDate, 6, 'day');
        this.getUserInfo();
        this.getData();
        console.log('API_URL:', API_URL);
    }

    myFilter = (d: Date): boolean => d.getDay() === 1;
    getMonday = (d: Date): Date => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    getRouteParam(name) {
        let value = null;
        this.route.params.subscribe((p: Params) => {
            if (p[name] !== undefined) {
                value = p[name];
            }
        });
        return value;
    }

    ngAfterViewInit() {
        console.log('this.router.url:', this.router.url);
        const
            scheduler: any = this.scheduler.schedulerInstance,
            eventsGrid = this.eventsGridComponent.grid,
            equipmentsGrid = this.equipmentsGridComponent.grid,
            extrasGrid = this.extrasGridComponent.grid,
            userGrid = this.userGridComponent.grid,
            equipmentStore = new EquipmentStore({
                modelClass: EventModel,
                readUrl: API_URL + '/schedulers/equipments.json',
                sorters: [
                    {field: 'name', ascending: true}
                ],
                durationUnit: 'd',
                equipment: []
            }),
            extraStore = new ExtraStore({
                modelClass: EventModel,
                readUrl: API_URL + '/schedulers/extras.json',
                sorters: [
                    {field: 'name', ascending: true}
                ],
                durationUnit: 'd',
                extra: []
            }),
            customerStore = new CustomerStore({
                modelClass: EventModel,
                readUrl: API_URL + '/schedulers/users.json',
                sorters: [
                    {field: 'name', ascending: true}
                ],
                customer: []
            });
        // const eventStore = scheduler.eventStore;
        const eventStore = new ProjectStore({
            modelClass: EventModel,
            readUrl: `${API_URL}/schedulers/projects/${this.selectedUser}.json`,
            sorters: [
                {field: 'name', ascending: true}
            ],
            durationUnit: 'd',
            project: []
        });
        eventsGrid.store = eventStore.makeChained(() => true, [], {});
        eventStore.load({}).then(event => {
            // this.onProjectStoreLoad(event);
        });
        equipmentsGrid.store = equipmentStore.makeChained(() => true, [], {});
        equipmentStore.load({}).then(event => {
            this.onEquipmentStoreLoad(event);
        });
        extrasGrid.store = extraStore.makeChained(() => true, [], {});
        extraStore.load({}).then(event => {
            this.onExtraStoreLoad(event);
        });
        userGrid.store = customerStore.makeChained(() => true, [], {});
        customerStore.load({}).then(event => {
            this.onUsersStoreLoad(event);
        });
        // event renderer expects equipmentStore to be class property of scheduler
        scheduler.equipmentStore = equipmentStore;
        scheduler.extraStore = extraStore;
        scheduler.customerStore = customerStore;
        eventsGrid.eventStore = eventStore;
        eventStore.on({
            update: ({record, changes}) => {
                if ('resourceId' in changes && !record.resourceId) {
                    // eventStore.remove(record);
                    eventsGrid.store.add(record);
                }
                if (this.autoRescheduleTasks) {
                    this.rescheduleOverlappingTasks(record);
                }
            },
            add: ({records}) => {
                if (this.autoRescheduleTasks) {
                    records.forEach((eventRecord) => this.rescheduleOverlappingTasks(eventRecord));
                }
            }
        });

        this.initDragProjects(scheduler, eventsGrid);
        this.initDragEquipments(scheduler, equipmentsGrid);
        this.initDragExtras(scheduler, extrasGrid);
        this.initDragUsers(scheduler, userGrid);
    }

    onDatePickerChange(value) {
        this.scheduler.schedulerInstance.setTimeSpan(value, DateHelper.add(value, 7, 'day'));
    }

    onChangeUserPicker(event) {
        this.filterUser(event.value);
    }

    private filterUser(id) {
        this.scheduler.schedulerInstance.resourceStore.filter({
            filters: resource => {
                if (resource.data.id == id) {
                    this.selectedUserResource = resource;
                    return true;
                }
                return false;
            },
            replace: true
        });
        this.scheduler.schedulerInstance.refreshRows();

        this.getProjects();
    }

    onProjectStoreLoad({source: store}) {
        const
            scheduler = this.scheduler.schedulerInstance,
            combo = scheduler.features.eventEdit.getEditor().query((item) => item.name === 'project');

        combo.items = store.getRange();
        scheduler.refreshRows();

    }

    onEquipmentStoreLoad({source: store}) {
        const
            scheduler = this.scheduler.schedulerInstance,
            combo = scheduler.features.eventEdit.getEditor().query((item) => item.name === 'equipment');

        combo.items = store.getRange();
        scheduler.refreshRows();

    }

    onExtraStoreLoad({source: store}) {
        const
            scheduler = this.scheduler.schedulerInstance,
            combo = scheduler.features.eventEdit.getEditor().query((item) => item.name === 'extra');

        combo.items = store.getRange();
        scheduler.refreshRows();
    }

    onUsersStoreLoad({source: store}) {
        const
            scheduler = this.scheduler.schedulerInstance,
            combo = scheduler.features.eventEdit.getEditor().query((item) => item.name === 'customer');

        combo.items = store.getRange();
        scheduler.refreshRows();
    }

    initDragProjects(scheduler, grid) {
        const drag = new DragHelper({
            cloneTarget: true,
            mode: 'translateXY',
            // Only allow drops on the schedule area
            dropTargetSelector: '.b-timeline-subgrid',

            // Only allow drag of row elements inside on the unplanned grid
            targetSelector: '.b-grid-row',
            constrain: false,
            outerElement: grid.element
        });

        drag.on({
            dragstart: ({event, context}) => {
                const
                    me = drag,
                    mouseX = context.clientX,
                    proxy = context.element,
                    task = grid.getRecordFromElement(context.grabbed),
                    newWidth = scheduler.timeAxisViewModel.getDistanceForDuration(task.durationMS)
                ;

                // save a reference to the task so we can access it later
                context.task = task;

                // Mutate dragged element (grid row) into an event bar
                proxy.classList.remove('b-grid-row');
                proxy.classList.add('b-sch-event-wrap');
                proxy.classList.add('b-unassigned-class');
                proxy.innerHTML = task.name;

                // If the new width is narrower than the grabbed element...
                if (context.grabbed.offsetWidth > newWidth) {
                    const proxyRect = Rectangle.from(context.grabbed);

                    // If the mouse is off (nearly or) the end, centre the element on the mouse
                    if (mouseX > proxyRect.x + newWidth - 20) {
                        context.newX = context.elementStartX = context.elementX = mouseX - newWidth / 2;
                        DomHelper.setTranslateX(proxy, context.newX);
                    }
                }

                proxy.style.width = `${newWidth}px`;

                // Prevent tooltips from showing while dragging
                scheduler.element.classList.add('b-dragging-event');

            },
            drag: ({event, context}) => {
                const
                    me = drag,
                    date = scheduler.getDateFromCoordinate(DomHelper.getTranslateX(context.element), 'round', false),
                    resource = context.target && scheduler.resolveResourceRecord(context.target)
                ;

                // Don't allow drops anywhere, only allow drops if the drop is on the time axis and on top of a Resource
                context.valid = context.valid && Boolean(date && resource) && this.checkProjectValid(context.task);

                // Save reference to resource so we can use it in onTaskDrop
                context.resource = resource;
            },
            drop: ({context, event}) => {
                const
                    me = drag,
                    task = context.task,
                    target = context.target
                ;

                if (context.valid && target) {
                    const date = scheduler.getDateFromCoordinate(DomHelper.getTranslateX(context.element), 'round', false);
                    if (date) {
                        if (this.checkProjectValid(task)) {
                            task.setStartDate(date, true);
                            task.resource = context.resource;
                            scheduler.eventStore.add(task);
                            this.onChangeEvents();
                        } else {
                            alert('Already Scheduled.');
                        }
                    }
                    context.finalize();
                } else {
                    me.abort();
                }
                scheduler.element.classList.remove('b-dragging-event');

            }
        });
    }

    initDragEquipments(scheduler, grid) {
        const drag = new DragHelper({
            cloneTarget: true,
            mode: 'translateXY',
            dropTargetSelector: '.b-sch-event',
            targetSelector: '.b-grid-cell',
            outerElement: grid.element
        });

        drag.on({
            dragstart: ({event, context}) => {
                // save a reference to the equipment so we can access it later
                context.equipment = grid.getRecordFromElement(context.grabbed);

                // Prevent tooltips from showing while dragging
                scheduler.element.classList.add('b-dragging-event');
            },
            drag: ({event, context}) => {
                const
                    equipment = context.equipment,
                    resource = context.target && scheduler.resolveResourceRecord(context.target),
                    eventRecord = scheduler.resolveEventRecord(context.target);
                const equipments = (eventRecord && eventRecord.equipment) ? eventRecord.equipment : [];
                context.valid = context.valid && Boolean(resource) && this.checkEquipmentValid(equipment, equipments);
            },
            drop: ({context, event}) => {
                const target = context.target;
                if (context.valid && target) {
                    const
                        equipment = context.equipment,
                        eventRecord = scheduler.resolveEventRecord(context.target);
                    const equipments = (eventRecord && eventRecord.equipment) ? eventRecord.equipment : [];
                    if (eventRecord && this.checkEquipmentValid(equipment, equipments)) {
                        eventRecord.equipment = equipments.concat(equipment.data.id);
                        context.finalize();
                        this.onChangeEvents();
                    } else {
                        alert('Already added.');
                    }
                } else {
                    drag.abort();
                }

                scheduler.element.classList.remove('b-dragging-event');
            }
        });
    }

    initDragExtras(scheduler, grid) {
        const drag = new DragHelper({
            cloneTarget: true,
            mode: 'translateXY',
            dropTargetSelector: '.b-sch-event',
            targetSelector: '.b-grid-cell',
            outerElement: grid.element
        });

        drag.on({
            dragstart: ({event, context}) => {
                // save a reference to the equipment so we can access it later
                context.extra = grid.getRecordFromElement(context.grabbed);

                // Prevent tooltips from showing while dragging
                scheduler.element.classList.add('b-dragging-event');
            },
            drag: ({event, context}) => {
                const
                    extra = context.extra,
                    resource = context.target && scheduler.resolveResourceRecord(context.target),
                    eventRecord = scheduler.resolveEventRecord(context.target);
                const extras = (eventRecord && eventRecord.extra) ? eventRecord.extra : [];
                context.valid = context.valid && Boolean(resource) && this.checkEquipmentValid(extra, extras);
            },
            drop: ({context, event}) => {
                const target = context.target;
                if (context.valid && target) {
                    const
                        extra = context.extra,
                        eventRecord = scheduler.resolveEventRecord(context.target);
                    const extras = (eventRecord && eventRecord.extra) ? eventRecord.extra : [];
                    if (this.checkEquipmentValid(extra, extras)) {
                        eventRecord.extra = extras.concat(extra.data.id);
                        context.finalize();
                        this.onChangeEvents();
                    } else {
                        alert('Already added.');
                    }
                } else {
                    drag.abort();
                }

                scheduler.element.classList.remove('b-dragging-event');
            }
        });
    }

    initDragUsers(scheduler, grid) {
        const drag = new DragHelper({
            cloneTarget: true,
            mode: 'translateXY',
            dropTargetSelector: '.b-sch-event',
            targetSelector: '.b-grid-cell',
            outerElement: grid.element
        });
        console.log(scheduler, grid);
        drag.on({
            dragstart: ({event, context}) => {
                // save a reference to the equipment so we can access it later
                context.customer = grid.getRecordFromElement(context.grabbed);

                // Prevent tooltips from showing while dragging
                scheduler.element.classList.add('b-dragging-event');
            },
            drag: ({event, context}) => {
                const
                    customer = context.customer,
                    resource = context.target && scheduler.resolveResourceRecord(context.target),
                    eventRecord = scheduler.resolveEventRecord(context.target);
                const customers = (eventRecord && eventRecord.customer) ? eventRecord.customers : [];
                context.valid = context.valid && Boolean(resource) && this.checkEquipmentValid(customer, customers);
            },
            drop: ({context, event}) => {
                const target = context.target;
                if (context.valid && target) {
                    const
                        customer = context.customer,
                        eventRecord = scheduler.resolveEventRecord(context.target);
                    const customers = (eventRecord && eventRecord.customer) ? eventRecord.customer : [];
                    if (this.checkEquipmentValid(customer, customers)) {
                        eventRecord.customer = customers.concat(customer.data.id);
                        context.finalize();
                        this.onChangeEvents();
                    } else {
                        alert('Already added.');
                    }
                } else {
                    drag.abort();
                }

                scheduler.element.classList.remove('b-dragging-event');
            }
        });
    }

    rescheduleOverlappingTasks(eventRecord) {
        if (eventRecord.resource) {
            const
                futureEvents = [],
                earlierEvents = [];

            // Split tasks into future and earlier tasks
            eventRecord.resource.events.forEach(event => {
                if (event !== eventRecord) {
                    if (event.startDate >= eventRecord.startDate) {
                        futureEvents.push(event);
                    } else {
                        earlierEvents.push(event);
                    }
                }
            });

            if (futureEvents.length || earlierEvents.length) {
                futureEvents.sort((a, b) => a.startDate > b.startDate ? 1 : -1);
                earlierEvents.sort((a, b) => a.startDate > b.startDate ? -1 : 1);

                futureEvents.forEach((ev, i) => {
                    const prev = futureEvents[i - 1] || eventRecord;

                    ev.startDate = DateHelper.max(prev.endDate, ev.startDate);
                });

                // Walk backwards and remove any overlap
                [eventRecord, ...earlierEvents].forEach((ev, i, all) => {
                    const prev = all[i - 1];

                    if (ev.endDate > Date.now() && ev !== eventRecord && prev) {
                        ev.setEndDate(DateHelper.min(prev.startDate, ev.endDate), true);
                    }
                });
            }
        }
    }

    getUserInfo() {
        this.http.get(
            `${API_URL}/schedulers/users.json`
        ).subscribe((data: any) => {
            this.users = data;
            this.filterUser(this.users[0].id);
        });
    }

// fetch data for the scheduler
    getData() {
        this.http.get(
            `${API_URL}/schedulers/getSchedule/${this.selectedUser}.json`
        ).subscribe((data: any) => {
            this.events = data;
            this.filterUser(this.selectedUser);
        });
    }

    getProjects() {
        this.eventsGridComponent.grid.eventStore.readUrl = `${API_URL}/schedulers/projects/${this.selectedUser}.json`;
        this.eventsGridComponent.grid.eventStore.load();
    }

    private checkProjectValid(event) {
        const events = this.scheduler.schedulerInstance.eventStore.getEventsForResource(this.selectedUserResource);
        const filtered = events.filter((element: any) => element.data.project_id === event.data.project_id);
        return !(filtered.length > 0);
    }

    private checkEquipmentValid(equipment, equipments) {
        const filtered = equipments.filter((element: any) => element === equipment.data.id);
        return !(filtered.length > 0);
    }

    private onChangeEvents() {
        const events = this.scheduler.schedulerInstance.eventStore.getEventsForResource(this.selectedUserResource);
        console.log('onChangeEvents:', events);
        const postData = events.map((element: any) => {
            const data: any = JSON.parse(JSON.stringify(element.data));
            data.startDate = moment(data.startDate).format('YYYY-MM-DD');
            if (data.hasOwnProperty('endDate')) {
                data.endDate = moment(data.endDate).format('YYYY-MM-DD');
            }
            return data;
        });
        console.log(events);
        Toast.show({timeout: 3500, html: 'Scheduler had been changed.'});
        this.http.post(
            `${API_URL}/schedulers/saveScheduler/${this.selectedUser}.json`,
            JSON.stringify(postData)
        ).subscribe();
    }

    async onRemoveEvent(eventId) {
        this.http.get(`${API_URL}/schedulers/deleteScheduler/${eventId}.json`).subscribe();
    }

    dispatchEvent(event: any) {
        switch (event.type) {
            case 'beforeeventresizefinalize':
            case 'beforeeventdropfinalize':
            case 'aftereventsave':
            case 'item':
                setTimeout(() => this.onChangeEvents(), 500);
                break;
            case 'beforeeventdelete':
                setTimeout(() => this.onRemoveEvent(event.eventRecord.data.id), 500);
                break;
            default:
                return;
        }
    }
}

type ProjectStoreConfig = AjaxStoreConfig & {
    durationUnit: string;
    project: Model[];
};

class ProjectStore extends AjaxStore {
    project: Model[];

    constructor(config: Partial<ProjectStoreConfig>) {
        super(config);
    }
}

type EquipmentStoreConfig = AjaxStoreConfig & {
    durationUnit: string;
    equipment: Model[];
};

class EquipmentStore extends AjaxStore {
    equipment: Model[];

    constructor(config: Partial<EquipmentStoreConfig>) {
        super(config);
    }
}

type ExtraStoreConfig = AjaxStoreConfig & {
    durationUnit: string;
    extra: Model[];
};

class ExtraStore extends AjaxStore {
    extra: Model[];
    constructor(config: Partial<ExtraStoreConfig>) {
        super(config);
    }
}

type CustomerStoreConfig = AjaxStoreConfig & {
    customer: Model[];
};
class CustomerStore extends AjaxStore {
    customer: Model[];
    constructor(config: Partial<CustomerStoreConfig>) {
        super(config);
    }
}
