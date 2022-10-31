/**
 * Scheduler config file
 */

// UMD bundle is used to support IE11 browser. If you don't need it just use import {...} from 'bryntum-scheduler' instead
import { DateHelper, EventModel } from 'bryntum-scheduler/scheduler.umd.js';

const schedulerConfig = {
    rowHeight: 200,
    barMargin: 4,
    eventColor: 'indigo',
    columns: [],
    viewPreset: {
        timeResolution: {
            unit: 'day',
            increment: 1
        },
        headers: [
            {
                unit: 'month',
                dateFormat: 'MMM YYYY',
                align: 'start'
            },
            {
                unit: 'day',
                dateFormat: 'ddd'
            },
            {
                unit: 'day',
                dateFormat: 'DD'
            }
        ]
    },

    stripeFeature: false,
    timeRangesFeature: false,
    createEventOnDblClick: false,
    createEvent : false,
    scheduleMenuFeature: {
        items: {
            addEvent : false,
        }
    },
    eventMenuFeature: {
        addEvent : false,
        items: [
            // custom item with inline handler
            {
                text: 'Remove all equipment',
                icon: 'b-fa b-fa-times',
                weight: 200,
                onItem: ({eventRecord}) => eventRecord.equipment = []
            },
            {
                text: 'Remove all extras',
                icon: 'b-fa b-fa-times',
                weight: 200,
                onItem: ({eventRecord}) => eventRecord.extra = []
            },
        ]
    },
    eventEditFeature: {
        // Add an extra combo box to the editor to select equipment
        items: {
            nameField: false,
            addEvent : false,
            equipment: {
                type: 'combo',
                editable: false,
                multiSelect: true,
                valueField: 'id',
                displayField: 'name',
                name: 'equipment',
                label: 'Equipment',
                items: []
            },
            extra: {
                type: 'combo',
                editable: false,
                multiSelect: true,
                valueField: 'id',
                displayField: 'name',
                name: 'extra',
                label: 'Extra',
                items: []
            },
            users: {
                type: 'combo',
                editable: false,
                multiSelect: true,
                valueField: 'id',
                displayField: 'name',
                name: 'customer',
                label: 'Users',
                items: []
            },
        }
    },
    eventBodyTemplate: data => {
        console.log('eventBodyTemplate:', data);
        return `
            <div class="b-sch-event-header">${data.name}</div>
            <div class="b-sch-event-footer">
                ${data.equipment.map((item) => `<div title="${item.name}" class="b-chiper">${item.name}</div>`).join('')}
            </div>
            <div class="b-sch-event-footer">
                ${data.extra.map((item) => `<div title="${item.name}" class="b-chiper">${item.name}</div>`).join('')}
            </div>
            <div class="b-sch-event-footer">
                ${data.customer.map((item) => `<div title="${item.name}" class="b-chiper">${item.name}</div>`).join('')}
            </div>
        `;
    },
    eventRenderer({eventRecord}) {
        console.log('eventRecord.customer', eventRecord.customer);
        return {
            date: DateHelper.format(eventRecord.startDate, 'YYYY/MM/DD'),
            name: eventRecord.name || '',
            equipment: this.equipmentStore ? eventRecord.equipment.map((itemId) => this.equipmentStore.getById(itemId) || {}) : [],
            extra: this.extraStore ? eventRecord.extra.map((itemId) => this.extraStore.getById(itemId) || {}) : [],
            customer: this.customerStore && eventRecord.customer ? eventRecord.customer.map((itemId) => this.customerStore.getById(itemId) || {}) : []
        };
    },
};

export default schedulerConfig;
