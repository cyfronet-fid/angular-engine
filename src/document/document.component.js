angular.module('engine.document')
.component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        documentChange: '&',
        document: '=',
        options: '=',
        stepList: '=',
        step: '=',
        validatedSteps: '=',
        showValidationButton: '=',
        documentId: '@',
        actions: '=',
        parentDocumentId: '@'
    }
})
.controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument,
                                            engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx,
                                            engineAction, engineMetricCategories, StepList, DocumentForm,
                                            DocumentActionList, $q, $log) {
    var self = this;
    console.log($scope);
    this.document = null;
    self.documentScope = $scope;
    $scope.steps = this.options.document.steps;

    this.actionList = null;
    this.documentForm = new DocumentForm();


    /**
     * **NOTE** this function should be called only after all required promises are fulfilled:
     * * this.stepList.$ready
     * * this.documentForm.$ready
     *
     * Initializes document (loads document data, loads available actions, loads metrics for forms)
     * everything is accomplished by chaining promises, method returns promise itself, which should be
     * consumed in order to make sure that all asynchronous operations have been compleated
     *
     * @returns {Promise<R>|IPromise<U>|Promise<U>}
     */
    this.initDocument = function initDocument() {
        var message = 'engineDocumentCtrl.initDocument called before all required dependencies were resolved, make ' +
                      'sure that iniDocument is called after everything is loaded';

        assert(self.stepList.$ready, message);
        assert(self.documentForm.$ready, message);

        self.stepList.setCurrentStep(self.step);

        var _actionsToPerform = [];

        //if the document exists, the first action will be retriving it
        if (self.documentId && self.documentId != 'new') {
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (data) {
                self.document = data.document;
                // self.documentChange(self.document);
            }));
        } //if document does not exist copy base from optionas, and set the name
        else {
            self.document = angular.copy(self.options.documentJSON);
            self.document.name = (self.options.name || 'Document') + ' initiated on ' + (new Date());
        }

        // return chained promise, which will do all other common required operations:
        return $q.all(_actionsToPerform).then(function () {
            self.actionList = new DocumentActionList(self.document, self.parentDocumentId, $scope);
            return self.actionList.$ready;
        }).then(function () {
            self.documentForm.init(self.document, self.options, self.stepList);
            //load metrics to form
            return self.documentForm.loadMetrics();
        });
    };

    /**
     * This method is called after whole document was initiated,
     * here all $watch, and other such methods should be defined
     */
    this.postinitDocument = function postinitDocument() {
        self.documentForm.makeForm();

        if(self.actionList.getSaveAction() == null)
            self.documentForm.setEditable(false);

        $scope.$watch('$ctrl.step', self.onStepChange);
    };

    this.onStepChange = function (newStep, oldStep) {
        if(newStep != oldStep){
            if(self.documentForm.isEditable()){
                self.documentForm.validate(oldStep);
                self.save();
            }
        }
        self.stepList.setCurrentStep(newStep);
        self.documentForm.setStep(newStep);
    };

    this.save = function () {
        return self.actionList.callSave();
    };

    $scope.$on('engine.common.document.validate', function () {
        self.documentForm.validate().then(function (valid) {
            if(!valid)
                self.step = self.stepList.getFirstInvalidIndex();
        });
    });

    $scope.$on('engine.common.action.after', function (event, document, action, result) {

    });

    $q.all(this.stepList.$ready, this.documentForm.$ready).then(this.initDocument).then(this.postinitDocument).then(function () {
        $log.debug('engineDocumentCtrl initialized: ', self);
    });
});