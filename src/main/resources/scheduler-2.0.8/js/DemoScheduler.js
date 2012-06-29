Ext.define("App.DemoScheduler", {
    extend          : "Sch.panel.SchedulerGrid",
    
    requires        : [
        'App.DemoEditor',
        'Ext.grid.plugin.CellEditing'
    ],
    
    rowHeight           : 34,
    snapToIncrement     : true,
    eventBarIconClsField : 'EventType',

    eventRenderer       : function (item, resourceRec, tplData, row, col, ds) {
        var bookingStart = item.getStartDate();
        tplData.style = 'background-color:' + (resourceRec.get('Color') || 'Coral');

        return {
            headerText: Ext.Date.format(bookingStart, this.getDisplayDateFormat()),
            footerText: item.getName()
        };
    },
    

    initComponent : function() {
        
        Ext.apply(this, {

            columns: [
                { header: 'Staff', sortable: true, width: 80, dataIndex: 'Name', field: new Ext.form.field.Text() },
                { header: 'Type', sortable: true, width: 120, dataIndex: 'Type', field: new Ext.form.field.ComboBox({
                        store: ['Sales', 'Developer', 'Marketing', 'Product manager'],
                        typeAhead: true,
                        forceSelection: true,
                        triggerAction: 'all',
                        selectOnFocus: true
                    }) 
                },
                //{ header: 'Task Color', sortable: false, width: 100, dataIndex: 'Color', field: new Ext.form.field.Text() },
                {
                    xtype       : 'actioncolumn',
                    
                    sortable    : false,
                    align       : 'center',
                    tdCls       : 'sch-valign',
                    width       : 22,
                    
                    position    : 'right',
                    
                    items: [
                        {
                            iconCls     : 'delete',  
                            tooltip     : 'Clear row',
                            scope : this,
                            handler     : function (view, rowIndex, colIndex) {
                                var resourceId = this.resourceStore.getAt(rowIndex).get('Id'),
                                    events = this.getSchedulingView().getEventsInView(),
                                    toRemove = [];
                                 
                                events.each(function(r) {
                                    if (resourceId === r.getResourceId()) {
                                        toRemove.push(r);
                                    }
                                });
                                
                                this.eventStore.remove(toRemove);
                            }
                        }
                    ]
                }
            ],

            // Specialized body template with header and footer
            eventBodyTemplate: new Ext.Template(
                '<div class="sch-event-header">{headerText}</div>' +
                '<div class="sch-event-footer">{footerText}</div>'
            ),

            border: true,
            tbar: [
                {
                    iconCls: 'icon-previous',
                    scale: 'medium',
                    scope : this,
                    handler: function () {
                        this.shiftPrevious();
                    }
                },
                {
                    id: 'span3',
                    enableToggle: true,
                    text: 'Select Date...',
                    toggleGroup: 'span',
                    scope : this,
                    menu :     Ext.create('Ext.menu.DatePicker', {
                        handler: function(dp, date){
                            var D = Ext.Date;
                            this.setTimeSpan(D.add(date, D.HOUR, 8), D.add(date, D.HOUR, 18));
                        },
                        scope : this
                    })
                },
                '->',
                {
                    text            : 'Horizontal view',
                    pressed         : true,
                    
                    enableToggle    : true,
                    toggleGroup     : 'orientation',
                    
                    iconCls         : 'icon-horizontal',
                    
                    scope           : this,
                    handler         : function() {
                        this.setOrientation('horizontal');
                    }
                },
                {
                    text            :  'Vertical view',
                    
                    enableToggle    : true,
                    toggleGroup     : 'orientation',
                    
                    iconCls         : 'icon-vertical',
                    
                    scope           : this,
                    handler         : function() {
                        this.setOrientation('vertical');
                    }
                },
                {
                    iconCls: 'icon-cleardatabase',
                    tooltip: 'Clear database',
                    scale: 'medium',
                    scope : this,
                    handler: function () {
                        this.eventStore.removeAll();
                    }
                },
                {
                    iconCls: 'icon-next',
                    scale: 'medium',
                    scope : this,
                    handler: function () {
                        this.shiftNext();
                    }
                }
            ],

            tooltipTpl: new Ext.XTemplate(
                '<dl class="eventTip">',
                    '<dt class="icon-clock">Time</dt><dd>{[Ext.Date.format(values.StartDate, "Y-m-d G:i")]}</dd>',
                    '<dt class="icon-task">Task</dt><dd>{Title}</dd>',
                    '<dt class="icon-earth">Location</dt><dd>{Location}&nbsp;</dd>',
                '</dl>'
            ).compile(),

            plugins: [
                this.editor = Ext.create("App.DemoEditor", {
                    // Extra config goes here
                }),
                
                Ext.create('Ext.grid.plugin.CellEditing', {
                    clicksToEdit: 1
                })            
            ],
    
            onEventCreated : function(newEventRecord) {
                // Overridden to provide some default values
                newEventRecord.set('Title', 'New task...');
                newEventRecord.set('Location', 'Local office');
                
                newEventRecord.set('EventType', 'Meeting');
            }
        });

        this.callParent(arguments);
    }
});