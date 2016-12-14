angular.module('engine.document')
.component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '=',
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
    $scope.documentScope = $scope;
    $scope.document = null;
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
                $scope.document = data.document;
            }));
        } //if document does not exist copy base from optionas, and set the name
        else {
            $scope.document = angular.copy(self.options.documentJSON);
            $scope.document.name = (self.options.name || 'Document') + ' initiated on ' + (new Date());
        }

        // return chained promise, which will do all other common required operations:
        return $q.all(_actionsToPerform).then(function () {
            self.actionList = new DocumentActionList($scope.document, self.parentDocumentId);
            return self.actionList.$ready;
        }).then(function () {
            self.documentForm.init($scope.document, self.options, self.stepList);
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

        $scope.$watch('$ctrl.step', function (newStep, oldStep) {
            if(newStep != oldStep){
                if(self.documentForm.isEditable()){
                    self.documentForm.validate();
                    self.save();
                }
            }
            self.stepList.setCurrentStep(newStep);
            self.documentForm.setStep(newStep);
        });
    };

    this.save = function () {
        return self.actionList.callSave();
    };

    $scope.onChangeStep = function (newStep, oldStep) {
        if(self.isEditable()) {
            if($scope.document.id){
            var stepToValidate = oldStep;

            self.validatedSteps[stepToValidate] = 'loading';

            var _documentPart = angular.copy($scope.document);
            _documentPart.metrics = {};

            var _categoriesToValidate = $scope.steps[stepToValidate].categories;

            angular.forEach(self.allMetrics_d, function (metric, metricId) {
                if(_.contains(_categoriesToValidate, metric.categoryId))
                    _documentPart.metrics[metricId] = $scope.document.metrics[metricId];
            });



            engineDocument.validate(_documentPart, function (data) {
                console.log(data);
                self.form.form.$externalValidated = true;
                self.form.backendValidation = data;

                if(self.form.backendValidation.valid)
                    self.validatedSteps[stepToValidate] = 'valid';
                else
                    self.validatedSteps[stepToValidate] = 'invalid';

                angular.forEach(self.form.backendValidation.results, function (metric) {
                    if(metric.metricId in $scope.metrics && $scope.metrics[metric.metricId].formControl){
                        $scope.metrics[metric.metricId].validation.show = true;
                        $scope.metrics[metric.metricId].formControl.$validate();
                    }
                });

                // self.form.form.$setValidity('proposalName', false. self.form.form);
            }, function (response) {
                self.validatedSteps[stepToValidate] = 'invalid';
            });
            }

        }
    };

    $scope.$on('engine.common.document.validate', function () {
        self.documentForm.validate();
    });

    $scope.$on('engine.common.action.after', function (event, document, action, result) {

    });

    $q.all(this.stepList.$ready, this.documentForm.$ready).then(this.initDocument).then(this.postinitDocument).then(function () {
        $log.debug('engineDocumentCtrl initialized: ', self);
    });
});