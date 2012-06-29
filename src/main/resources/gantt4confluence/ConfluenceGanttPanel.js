ConfluenceGanttPanel = Ext.extend(Sch.gantt.GanttPanel, {
    rightLabelField : 'Responsible',
    highlightWeekends : true,
    showTodayLine : true,
    loadMask : true,
    stripeRows : true,
    enableProgressBarResize : true,

    initComponent : function() {
        
        Ext.apply(this, {
            leftLabelField : {
                dataIndex : 'Name',
                editor : { xtype : 'textfield' }
            },
            
            // Add some extra functionality
            plugins : [new Sch.gantt.plugins.TaskContextMenu(), new Sch.plugins.Pan()],

            // Define an HTML template for the tooltip
            tooltipTpl : new Ext.XTemplate(
                '<h4 class="tipHeader">{Name}</h4>',
                '<table class="taskTip">', 
                    '<tr><td>Start:</td> <td align="right">{[values.StartDate.format("y-m-d")]}</td></tr>',
                    '<tr><td>End:</td> <td align="right">{[values.EndDate.format("y-m-d")]}</td></tr>',
                    '<tr><td>Progress:</td><td align="right">{PercentDone}%</td></tr>',
                '</table>'
            ).compile(),
            
            // Define the static columns
            columns : [
                {
                    header : 'Tasks', 
                    sortable:true, 
                    dataIndex : 'Name', 
                    locked : true,
                    width:180, 
                    editor : new Ext.form.TextField({ allowBlank : false }),
                    renderer : function (v, m, r) {
                        if (r.get('IsLeaf')) {
                            m.css = 'task';
                        } else {
                            m.css = 'parent';
                        }
                        return v;
                    }
                },
                {
                    header : 'Start', 
                    sortable:true, 
                    width:90, 
                    dataIndex : 'StartDate', 
                    locked : true,
                    renderer: Ext.util.Format.dateRenderer('m/d/Y'),
                    editor : new Ext.form.DateField({
                        allowBlank : false,
                        format: 'm/d/y'
                    })
                },
                {
                    header : 'Duration', 
                    sortable:true, 
                    width:50, 
                    dataIndex : 'Duration', 
                    renderer: function(v, m, r) {
                        var start = r.get('StartDate'),     
                            end = r.get('EndDate');
                        if (start && end) {
                            var d = Math.round(Sch.util.Date.getDurationInDays(start, end));
                            if (d > 0) {
                                return d + 'd';
                            }
                        }
                    }, 
                    locked : true, 
                    editor: new Ext.ux.form.SpinnerField({
                        allowBlank:false,
                        minValue : 0,
                        decimalPrecision: 1,
                        incrementValue : 1
                    })
                },
                {
                    header : '% Done', 
                    sortable:true, 
                    width:50, 
                    dataIndex : 'PercentDone', 
                    renderer: function(v, m, r) {
                        return typeof v === 'number' ? (v + '%') : '';
                    }, 
                    locked : true, 
                    editor: new Ext.ux.form.SpinnerField({
                        allowBlank:false,
                        minValue : 0,
                        maxValue : 100,
                        incrementValue : 10
                    })
                }
            ],
            
             // Define the buttons that are available for user interaction
            tbar : [
				{
				    text: 'Save',
				    iconCls: 'icon-disk',
				    scope: this,
				    handler: function (btn) {
				    	var jsontasks = Ext.encode(Ext.pluck(this.taskStore.data.items, 'data'));
				        Ext.Ajax.request({
				        	url: this.confluenceBaseURL+'/plugins/servlet/gantt4confluence',
				        	method : 'POST', 
				        	params: {
				        		action: 'save', 
				        		pageid: this.confluencePageID, 
				        		filename: this.confluenceFilename+'.tasks.json',
				        		body: jsontasks
				        		},
				        	scope: this,
				        	success: function(response){
				        		
				        		var jsondeps = Ext.encode(Ext.pluck(this.dependencyStore.data.items, 'data'));
				                Ext.Ajax.request({
				                	url: this.confluenceBaseURL+'/plugins/servlet/gantt4confluence',
				                	method : 'POST', 
				                	params: {
				                		action: 'save', 
				                		pageid: this.confluencePageID,
				                		filename: this.confluenceFilename+'.deps.json',
				                		body: jsondeps
				                		}, 
				                	success: function(response){
				                		Ext.MessageBox.alert('Status', 'Changes saved successfully.', response);
				                		}, 
				                	failure: function(response){ 
				                		Ext.MessageBox.alert('Status', 'Failure during save operation.', response);
				                		} 
				                	});
				        		 
				        		}, 
				        	failure: function(response){ 
				        		Ext.MessageBox.alert('Status', 'Failure during save operation.', response); 
				        		} 
				        	});
				        
				        
				    }
				},
				{
                    text : 'Highlight critical chain',
                    iconCls : 'togglebutton',
                    scope : this,
                    enableToggle : true,
                    handler : function(btn) {
                        if (btn.pressed) {
                            this.highlightCriticalPaths(true);
                        } else {
                            this.unhighlightCriticalPaths(true);
                        }
                    }
                },
                {
                    iconCls : 'action',
                    text : 'Scroll to last task',
                    scope : this,
                    handler : function(btn) {
                        var last = this.taskStore.getAt(this.taskStore.getCount()-1);
                        this.getView().scrollEventIntoView(last);
                    }
                },
				'->',
				{
                    xtype : 'textfield',
                    emptyText : 'Search for task...',
                    scope : this,
                    width:150,
                    enableKeyEvents : true,
                    listeners : {
                        keyup : {
                            fn : function(field) {
                                this.taskStore.filter('Name', field.getValue(), true, false);
                            },
                            scope : this
                        }
                    }
                }
				] //tbar
                
            
        }); //Ext.apply(this,
        
        ConfluenceGanttPanel.superclass.initComponent.apply(this, arguments);
    }
});