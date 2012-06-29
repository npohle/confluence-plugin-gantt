// A simple preconfigured editor plugin

Ext.define('App.DemoEditor',  {
    
    extend : "Sch.plugin.EventEditor",
    
    initComponent : function() {
        
        Ext.apply(this, {
            
            height          : 190,
            width           : 280,
            
            timeConfig      : {
                minValue    : '08:00',
                maxValue    : '18:00'
            },
            
//            dateConfig      : {
//            },
//            
//            durationUnit    : Sch.util.Date.DAY,
//            durationConfig  : {
//                minValue    : 1,
//                maxValue    : 10
//            },
            
            buttonAlign     : 'center',
            
            // panel with form fields
            fieldsPanelConfig : {
                xtype       : 'container',
                
                layout      : 'card',
                    
                items       : [
                    // form for "Meeting" EventType
                    {
                        EventType   : 'Meeting',
                        
                        xtype       : 'form',
                        
                        layout      : 'hbox',
                        
                        style       : 'background:#fff',
                        cls         : 'editorpanel',
                        border      : false,
                        
                        items       : [
                            {
                                xtype   : 'container',
                                cls     : 'image-ct',
                                
                                items   : this.img = new Ext.Img({
                                    cls : 'profile-image'
                                }),
                                
                                width   : 100
                            },
                            {
                                padding     : 10,
                                
                                style       : 'background:#fff',
                                border      : false,
                                
                                flex        : 2,
                                
                                layout      : 'anchor',
                                
                                defaults    : {
                                    anchor  : '100%'
                                },
                                
                                items       : [
                                    this.titleField = new Ext.form.TextField({
                                        
                                        // doesn't work in "defaults" for now (4.0.1)
                                        labelAlign  : 'top',
        
                                        name        : 'Title',
                                        fieldLabel  : 'Task'
                                    }),
                            
                                    this.locationField = new Ext.form.TextField({
                                        
                                        // doesn't work in "defaults" for now (4.0.1)
                                        labelAlign  : 'top',
        
                                        name        : 'Location',
                                        fieldLabel  : 'Location'
                                    })
                                ]
                            }
                        ]                    
                    },
                    // eof form for "Meeting" EventType
                    
                    // form for "Appointment" EventType
                    {
                        EventType   : 'Appointment',
                        
                        xtype       : 'form',
                        
                        style       : 'background:#fff',
                        cls         : 'editorpanel',
                        border      : false,
                        
                        padding     : 10,
                        
                        layout      : {
                            type    : 'vbox',
                            align   : 'stretch'
                        },
                        
                        items       : [
                            new Ext.form.TextField({
                                
                                // doesn't work in "defaults" for now (4.0.1)
                                labelAlign  : 'top',
                                
                                name        : 'Location',
                                fieldLabel  : 'Location'
                            }),                        
                            {
                                xtype       : 'combo',
                                
                                store       : [ "Dental", "Medical" ],
                                
                                labelAlign  : 'top',

                                name        : 'Type',
                                fieldLabel  : 'Type'
                            }
                        ]                    
                    }
                    // eof form for "Appointment" EventType
                ]
            }
            // eof panel with form fields
        });

        this.on('expand', this.titleField.focus, this.titleField);
        
        this.callParent();
    },

    
    show : function(eventRecord) {
        var resourceId = eventRecord.getResourceId();
        // Load the image of the resource
        this.img.setSrc(this.schedulerView.resourceStore.getById(resourceId).get('ImgUrl'));

        this.callParent(arguments);
    }
});