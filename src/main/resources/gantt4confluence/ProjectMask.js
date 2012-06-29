Ext.define('MyApp.view.ui.MyPanel', {
  extend: 'Ext.panel.Panel',
  width: 900,
  border: 0,
  renderTo: 'gantt4confluence',
    layout: {
        columns: 2,
        type: 'table',
        align: 'stretch',
        cellCls : 'verticalAlignTop',
    },

    initComponent: function() {
        var me = this;

        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'panel',
                    itemId: 'titlefieldpanel',
                    width: 200,
                    border: 0,
                    padding: 5,
                    layout: {colums:3, type:'table', align:'stretch'},
                    style: 'border-top: 3px solid grey;',
                    title: '',
                    items: [
						{
					        xtype: 'image',
					        src: 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
					        style : 'background: transparent no-repeat 0 0; background-image: url(\'http://dev.sencha.com/deploy/ext-4.0.0/resources/themes/images/default/tree/arrows.gif\'); background-position: -16px 0; height: 18px; width: 16px;', 
					        listeners: {
								click: {
				            		element: 'el', //bind to the underlying el property on the panel
				            		fn: function(e, elem, eObj){
										console.log('click el');
										if (elem.style['background-position']=='-16px 0px') {
											elem.style['background-position']='0px 0px';
											var trs = this.dom.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children;
											for (var line=1; line<trs.length; line++) {
												trs[line].style.display="none";
											}
											this.dom.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.height="";
											this.dom.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.height="";
										} else {
											elem.style['background-position']='-16px 0px';
											var trs = this.dom.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children;
											for (var line=1; line<trs.length; line++) {
												trs[line].style.display="table-row";
											}
										}
									}
				        		}
							}
					    },{
                            xtype: 'checkbox',
                            itemId: 'checkboxfield',
                            style: 'border: 0px;background-image:none;',
                            width: 20,
                            fieldLabel: ''
                        },
                        {
                            xtype: 'textfield',
                            itemId: 'titlefield',
                            width: 154,
                            style: 'border: 0px;background-image:none;',
                            fieldLabel: ''
                        }
                    ]
                },
                {
                    xtype: 'panel',
                  itemId: 'descriptionfieldpanel',
                    border: 0,
                    padding: 5,
                    style: 'border-top: 3px solid grey;',
                    title: '',
                    items: [
                        {
                            xtype: 'textareafield',
                          itemId: 'descriptionfield',
                          width: 690,
                          style: 'border: 0px;',
                            fieldLabel: '',
                            grow: true,
                            growAppend: ' ',
                            growMin: 23
                        }
                    ]
                },
                {
                    xtype: 'panel',
                  itemId: 'propertygridpanel',
                  width: 200,
                    border: 0,
                    padding: 5,
                    title: '',
                    //style: 'border-top: 3px solid grey;',
                    rowspan: 2,
                    items: [
                        {
                            xtype: 'propertygrid',
                          itemId: 'propertygrid',
                          width: 190,
                            border: 0,
                            title: '',
                            hideHeaders: true,
                            //source: projectproperties
                          source: {'Category':'',
                        	'Budget': '', 
                        	'Estimated Budget': '',
                        	'Current Budget': '',
                        	'Estimated ETA': '',
                        	'Current ETA': '',
                        	'KTR': '',
                        	'PfM / tPL': ''
                        	}
                        }
                    ]
                },
                {
                    xtype: 'panel',
                  itemId: 'lookbackgridpanel',
                    border: 0,
                    padding: 5,
                    //style: 'border-top: 3px solid grey;',
                    layout: {
                        type: 'fit'
                    },
                    title: '',
                    items: [
                        {
                            xtype: 'gridpanel',
                          itemId: 'lookbackgrid',
			    multiSelect: true,
                            layout: {
                                type: 'fit'
                            },
                            //store: eventStoreBehind,
                            store: Ext.create('Ext.data.Store', {model: 'Event'}),
                            title: '',
                            columns: [
                                {
                                    xtype: 'datecolumn',
                                    dataIndex: 'date',
                                    text: 'Look Back',
                                    width: 100,
                                    flex: 0,
                                    editor: {
                                        xtype: 'datefield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'datecolumn',
                                    dataIndex: 'end',
                                    text: 'ETA',
                                    width: 100,
                                    flex: 0,
                                    editor: {
                                        xtype: 'datefield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'gridcolumn',
                                    dataIndex: 'ev',
                                    text: 'EV (POC)',
                                    width: 100,
                                    editor: {
                                        xtype: 'textfield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'gridcolumn',
                                    dataIndex: 'milestone',
                                  flex: 1,
                                    text: 'Milestones',
                                    editor: {
                                        xtype: 'textfield',
                                        allowBlank: false
                                    }
                                }
                            ],
                            viewConfig: {
				plugins: {
                			ptype: 'gridviewdragdrop',
                			dragGroup: 'firstGridDDGroup',
                			dropGroup: 'secondGridDDGroup'
            			},
                                listeners: {
                                  itemkeydown : function(grid, record, item, index, e, eOpts) {
                                    if (e.getKey()==46) {
                                      grid.store.remove(record);
                                      var lastrow = grid.store.last();
                                      if (lastrow==null || (lastrow.get('date')+lastrow.get('end')+lastrow.get('ev')+lastrow.get('milestone')).replace(/null/g, '')!='') {
                                  	grid.store.add({ date: '', end:'', ev: '', milestone: '' });
                                      }
                                    }
                            	  }
                                }
                            },
                            plugins: [
                                Ext.create('Ext.grid.plugin.CellEditing', {})
                            ],
                          listeners: {
    				edit : function(e) {
                                  var lastrow = e.grid.store.last();
                                  if ((lastrow.get('date')+lastrow.get('end')+lastrow.get('ev')+lastrow.get('milestone')).replace(/null/g, '')!='') {
                                  	e.grid.store.add({ date: '', end: '', ev: '', milestone: '' });
                                  }
				}
			  }
                        }
                    ]
                },
                {
                    xtype: 'panel',
                  itemId: 'lookaheadgridpanel',
                    border: 0,
                    padding: 5,
                    title: '',
                    items: [
                        {
                            xtype: 'gridpanel',
			  itemId: 'lookaheadgrid',
                            width: '100%',
                            //store: eventStoreAhead,
                            store: Ext.create('Ext.data.Store', {model: 'Event'}),
                            title: '',
                            columns: [
                                {
                                    xtype: 'datecolumn',
                                    dataIndex: 'date',
                                    text: 'Look Ahead',
                                  width: 100,
                                    editor: {
                                        xtype: 'datefield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'datecolumn',
                                    dataIndex: 'end',
                                    text: 'ETA',
                                    width: 100,
                                    editor: {
                                        xtype: 'datefield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'gridcolumn',
                                    dataIndex: 'ev',
                                    text: 'EV (POC)',
                                  width: 100,
                                    editor: {
                                        xtype: 'textfield',
                                        allowBlank: false
                                    }
                                },
                                {
                                    xtype: 'gridcolumn',
                                    dataIndex: 'milestone',
                                    text: 'Milestones',
                                  flex: 1,
                                    editor: {
                                        xtype: 'textfield',
                                        allowBlank: false
                                    }
                                }
                            ],
                            viewConfig: {
				plugins: {
                			ptype: 'gridviewdragdrop',
                			dragGroup: 'secondGridDDGroup',
                			dropGroup: 'firstGridDDGroup'
            			},
                                listeners: {
                                  itemkeydown : function(grid, record, item, index, e, eOpts) {
                                    if (e.getKey()==46) {
                                      grid.store.remove(record);
                                      var lastrow = grid.store.last();
                                      if (lastrow==null || (lastrow.get('date')+lastrow.get('end')+lastrow.get('ev')+lastrow.get('milestone')).replace(/null/g, '')!='') {
                                  	  grid.store.add({ date: '', end:'', ev: '', milestone: '' });
                                      }
                                    }
                            	  }
                                }
                            },
                            plugins: [
                                Ext.create('Ext.grid.plugin.CellEditing', {})
                            ],
                          listeners: {
    				edit : function(e) {
                                  var lastrow = e.grid.store.last();
                                  if (lastrow==null || (lastrow.get('date')+lastrow.get('end')+lastrow.get('ev')+lastrow.get('milestone')).replace(/null/g, '')!='') {
                                  	e.grid.store.add({ date: '', end:'', ev: '', milestone: '' });
                                  }
				}
			  }
                        }
                    ]
                },
                {
                    xtype: 'panel',
                    title: '',
                  width: 200,
                  border: 0,
                  padding: 5,
                  items: [
                        {
                            xtype: 'label',
                            text: 'Remaining Risks',
                            style: 'font-weight: 100; font-color: #000000',
                          width: 190,
                          border: 0
                        }
                    ]
                },
                {
                    xtype: 'panel',
        	    itemId: 'riskfieldpanel',
                    title: '',
                   border: 0,
                   padding: 5,
                   items: [
                  	{
			    xtype: 'textareafield',
                          itemId: 'riskfield',
                          width: 690,
                            fieldLabel: '',
                            grow: true,
                            growMin: 23
                	}
                  ]
                },
                {
                    xtype: 'panel',
                    title: '',
                  width: 200,
                  border: 0,
                  padding: 5,
                  items: [
                        {
                            xtype: 'label',
                            text: 'Overall Evaluation',
                          width: 190,
                          style: 'font-weight: 100; font-color: #000000',
                          border: 0
                        }
                    ]
                },
                {
                    xtype: 'panel',
                  itemId: 'evaluationfieldpanel',
                    title: '',
                   border: 0,
                   padding: 5,
                   items: [
                  	{
			    xtype: 'textareafield',
                          itemId: 'evaluationfield',
                          width: 690,
                            fieldLabel: '',
                            grow: true,
                            growMin: 23
                	}
                  ]
                },
                {
                  xtype: 'panel',
                  title: '',
                  width: 200,
                  height: 30,
                  border: 0,
                },
                {
                  xtype: 'panel',
                  title: '',
                  width: 690,
                  height: 30,
                  border: 0,
                },
            ]
        });

        me.callParent(arguments);
    }
});


Ext.define('Event', {
    extend: 'Ext.data.Model',
    fields: [ 'date', 'end', 'ev', 'milestone' ]
});


