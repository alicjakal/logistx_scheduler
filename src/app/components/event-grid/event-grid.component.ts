/**
 * Grid component script
 */
import { Component, OnInit, ElementRef, Input, OnDestroy, } from '@angular/core';

// UMD bundle is used to support IE11 browser. If you don't need it just use import {...} from 'bryntum-scheduler' instead
import { Grid, EventStore, EventModel } from 'bryntum-scheduler/scheduler.umd.js';

@Component({
    selector : 'app-event-grid',
    template : '<div class="grid-ct"></div>',
    styleUrls: ['../grid.component.scss']
})

export class EventGridComponent implements OnInit, OnDestroy {

    // class properties
    private elementRef: ElementRef;
    public grid: any;

    // config options
    @Input() eventStore: EventStore;

    /**
     * Save our element
     * @param { ElementRef } element
     */
    constructor(element: ElementRef) {
        this.elementRef = element;
    }

    /**
     * Runs once on component init
     */
    ngOnInit() {
        const
            config = {
                appendTo   : this.elementRef.nativeElement.firstElementChild,
                eventStore : this.eventStore,
                features : {
                    sort   : 'name',
                    cellMenu : {
                        items : {
                            removeRow: false,
                        }
                    },
                    filterBar : true,
                },
                editable: false,
                columns : [{
                    text       : 'Projects',
                    flex       : 1,
                    editor: false,
                    field      : 'name',
                    htmlEncode : false,
                    filterable : true,
                    renderer   : (data) => `<i class="${data.record.iconCls}"></i>${data.record.name}`
                }],

                rowHeight : 50

            }
        ;

        this.grid = new Grid(config);
    }

    /**
     * Runs on component destroy.
     * Destroys the underlying event-grid
     */
    ngOnDestroy() {
        if (this.grid) {
            this.grid.destroy();
        }
    }

}


