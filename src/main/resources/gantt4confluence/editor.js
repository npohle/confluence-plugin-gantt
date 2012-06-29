

Ext.onReady(function () {
    Ext.QuickTips.init();

    App.Scheduler.init();
});

App.Scheduler = {

    // Bootstrap function
    init: function () {
        this.scheduler = this.createScheduler();

        this.initStoreEvents();
    },

    onEventContextMenu: function (s, rec, e) {
        e.stopEvent();

        if (!s.ctx) {
            s.ctx = new Ext.menu.Menu({
                items: [{
                    text: 'Delete event',
                    iconCls: 'icon-delete',
                    handler : function() {
                        s.eventStore.remove(s.ctx.rec);
                    }
                }]
            });
        }
        s.ctx.rec = rec;
        s.ctx.showAt(e.getXY());
    },

    // Don't show tooltip if editor is visible
    beforeTooltipShow: function (s, r) {
        return s.getEventEditor().collapsed;
    },

    initStoreEvents: function () {
        var s = this.scheduler;

        s.eventStore.on({
            'update' : function (store, bookingRecord, operation) {
                if (operation !== Ext.data.Model.EDIT) return;

                s.getView().getElementFromEventRecord(bookingRecord).addCls('sch-fake-loading');

                // Simulate server delay 1.5 seconds
                Ext.Function.defer(bookingRecord.commit, 1500, bookingRecord);
            },
            
            add : function(s, rs) {
                // Pretend it's been sent to server and stored
                rs[0].commit();
            }
        });

        s.resourceStore.on('load', function(rStore) {
            
            // Events piggyback on the resource store load
            s.eventStore.loadData(rStore.proxy.reader.jsonData.tasks);
        });
    },

    
    allowModify : function(s, r) {
        // Don't allow modifications while "fake loading" is happening
        return !r.dirty;
    },


    createScheduler: function () {
        
        Ext.define('Resource', {
            extend : 'Sch.model.Resource',
            idProperty : 'YourIdField',
            fields: [
                'YourIdField',
                'ImgUrl',
                'Type',
                'Color'
             ]
        });

        Ext.define('Event', {
            extend : 'Sch.model.Event',
            nameField : 'Title',

            fields: [
                'Type',
                'EventType',
                'Title',
                'Location'
             ]
        });

        // Store holding all the resources
        var resourceStore = Ext.create("Ext.data.JsonStore", {
            model   : 'Resource',
            
            proxy   : {
                type    : 'ajax',
                url     : App.dataurl,
                
                reader  : {
                    type    : 'json',
                    root    : 'staff'
                }
            },
            
            sortInfo: { field: 'Id', direction: "ASC" }
        });

        // Store holding all the events
        var eventStore = Ext.create("Ext.data.JsonStore", {
            model   : 'Event'
        });

        var start = new Date(2011, 1, 7, 8);

        var ds = Ext.create("App.DemoScheduler", {
            width       : 1030,
            height      : 400,
            renderTo    : 'my-div',
            
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            viewPreset  : 'hourAndDay',
            
            startDate   : start,
            endDate     : Sch.util.Date.add(start,Sch.util.Date.HOUR, 10),
            
            listeners   : {
                eventcontextmenu    : this.onEventContextMenu, 
                beforetooltipshow   : this.beforeTooltipShow, 
                beforeeventresize   : this.allowModify,
                beforeeventdrag     : this.allowModify,
                
                scope               : this
            }
        });
        
        resourceStore.load();
        
        return ds;
    }
};
