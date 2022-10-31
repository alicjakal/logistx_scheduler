/**
 * Grid component script
 */
import { Component, OnInit, ElementRef, Input, OnDestroy, } from '@angular/core';

import { Grid, EventStore } from 'bryntum-scheduler/scheduler.umd.js';

@Component({
    selector : 'app-equipment-grid',
    template : '<div class="grid-ct grid-equipment"></div>'
})

export class EquipmentGridComponent implements OnInit, OnDestroy {

    // class properties
    private elementRef: ElementRef;
    public grid: any;

    // config options
    @Input() equipmentStore: EventStore;
    @Input() isFilter: boolean = true;

    /**
     * Save our element
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
                equipmentStore : this.equipmentStore,
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
                    text       : 'Equipments',
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


