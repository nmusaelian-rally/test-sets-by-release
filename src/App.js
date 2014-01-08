Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',

    addContent: function() {
        this._makeStore();
    },
    
   onScopeChange: function() {
        console.log('onScopeChange');
        this._makeStore();
    },
    
    _makeStore: function(){
        Ext.create('Rally.data.WsapiDataStore', {
                model: 'TestSet',
                fetch: ['FormattedID', 'TestCases', 'TestCaseStatus'],  
                pageSize: 100,
                autoLoad: true,
                filters: [this.getContext().getTimeboxScope().getQueryFilter()],
                listeners: {
                    load: this._onTestSetsLoaded,
                    scope: this
                }
            }); 
    },
     _onTestSetsLoaded: function(store, data){
        console.log('store...',store);
	console.log('data...',data);
        var testSets = [];
        var pendingTestCases = data.length;
         console.log(data.length);
         if (data.length ===0) {
            this._createTestSetGrid(testSets);  //to force refresh on testset grid when there are no testsets in the iteration
         }
         Ext.Array.each(data, function(testset){ 
            var ts  = {
                FormattedID: testset.get('FormattedID'),   
                _ref: testset.get('_ref'),  //required to make FormattedID clickable
                TestCaseStatus: testset.get('TestCaseStatus'),
                TestCaseCount: testset.get('TestCases').Count,
                TestCases: []
            };
            var testCases = testset.getCollection('TestCases');
            testCases.load({
                                fetch: ['FormattedID'],
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(testcase){
                                        ts.TestCases.push({_ref: testcase.get('_ref'),
                                                        FormattedID: testcase.get('FormattedID')
                                                    });
                                    }, this);
                                    --pendingTestCases;
                                    if (pendingTestCases === 0) {
                                        this._createTestSetGrid(testSets);
                                    }
                                },
                                scope: this
                            });
            testSets.push(ts);
     },this);
 },
    
      _createTestSetGrid: function(testsets) {
        var testSetStore = Ext.create('Rally.data.custom.Store', {
                data: testsets,
                pageSize: 100,  
            });
        if (!this.down('#testsetgrid')) {
         this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'testsetgrid',
            store: testSetStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Test Case Count', dataIndex: 'TestCaseCount',
                },
                {
                    text: 'Test Case Status', dataIndex: 'TestCaseStatus', width: 40,
                },
                {
                    text: 'TestCases', dataIndex: 'TestCases', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(testcase){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(testcase) + '">' + testcase.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
            ]
        });
         }else{
            this.grid.reconfigure(testSetStore);
         }
    }
});

