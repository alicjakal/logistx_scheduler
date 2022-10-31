/**
 * Grid component script
 */
import { Component, OnInit, ElementRef, Input, OnDestroy, } from '@angular/core';

// UMD bundle is used to support IE11 browser. If you don't need it just use import {...} from 'bryntum-scheduler' instead
import { Grid, EventStore, EventModel } from 'bryntum-scheduler/scheduler.umd.js';

@Component({
    selector : 'app-extra-grid',
    template : '<div class="grid-ct grid-equipment"></div>'
})

export class ExtraGridComponent implements OnInit, OnDestroy {

    // class properties
    private elementRef: ElementRef;
    public grid: any;

    // config options
    @Input() extraStore: EventStore;
    @Input() isFilter: boolean = true;

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
                extraStore : this.extraStore,
                features : {
                    stripe : true,
                    sort   : 'name',
                    filterBar : this.isFilter,
                    cellMenu : {
                        items : {
                            removeRow: false,
                        }
                    },
                },
                rowHeight : 50,
                width: 219,
                columns : [{
                    text       : 'Extras',
                    field      : 'name',
                    htmlEncode : false,
                    cellCls    : 'b-equipment',
                    editor: false,
                    renderer   : (data) => `<i class="${data.record.iconCls}"></i>${data.record.name}`
                }],
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


