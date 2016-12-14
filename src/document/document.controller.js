angular.module('engine.document')
.component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '=',
        options: '=',
        steps: '=',
        step: '=',
        validatedSteps: '=',
        showValidationButton: '=',
        documentId: '@',
        actions: '=',
        parentDocumentId: '@'
    }
})
.controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams) {
    $scope.validatedSteps = [];
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    if(angular.isArray($scope.steps))
        angular.forEach($scope.steps, function (step) {
            $scope.validatedSteps.push('blank');
        });
    $scope.document = {};
    $scope.documentId = $routeParams.id;
    if($routeParams.step === undefined)
        $routeParams.step = 0;
    $scope.$routeParams = $routeParams;

    $scope.$watch('$routeParams.step', function (newVal, oldVal) {
        if(angular.isString(newVal)) {
            newVal = parseInt(newVal);
            $routeParams.step = newVal;
        }
        if(newVal !== oldVal) {
            $location.search({step: newVal || 0})
        }
    });
})
.controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument,
                                            engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx,
                                            engineAction, engineMetricCategories, StepList, DocumentForm, $q, $log) {
    var self = this;
    console.log($scope);
    $scope.documentScope = $scope;
    $scope.document = {};
    $scope.steps = this.options.document.steps;
    self.actions = [];
    $scope.metrics = {};
    this.allMetrics_d = {};
    this.showErrors = false;

    this.form = {
        form: {},
        options: {},
        backendValidation: {}
    };

    this.stepList = new StepList($scope.steps);
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
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (document) {
                $scope.document = data.document;
            }));
        } //if document does not exist copy base from optionas, and set the name
        else {
            $scope.document = angular.copy(self.options.documentJSON);
            $scope.document.name = (self.options.name || 'Document') + ' initiated on ' + (new Date());
        }

        // return chained promise, which will do all other common required operations:
        return $q.all(_actionsToPerform).then(function () {
            //load actions available for this document
            return engineActionsAvailable.forDocument($scope.document).$promise;
        }).then(function (actions) {
            self.actions = actions;
        }).then(function () {
            self.documentForm.init($scope.document, self.options, self.stepList);
            //load metrics to form
            return self.documentForm.loadMetrics();
        }).then(function() {
            self.documentForm.makeForm();
            self.documentForm.setStep(self.step);
        });
    };

    this.isEditable = function () {
        if(engineActionUtils.getCreateUpdateAction(self.actions) != null)
            return true;
        return false;
    };
    this.isDisabled = function () {
        return !self.isEditable();
    };



    this.generateFormFields = function () {
        console.debug('generating form fields for step '+self.step);

        var categories = {};
        $scope.documentFields = [];
        var data = self.allMetrics;
        if(angular.isArray($scope.steps))
            $scope.currentCategories = $scope.steps[self.step].categories;

        angular.forEach(data, function (metric) {
            // console.log(metric)




            if ($scope.steps == null || $scope.currentCategories.indexOf(metric.categoryId) != -1) {
                if (categories[metric.categoryId] == undefined) {
                    console.log(metric.categoryId);
                    categories[metric.categoryId] = {
                        templateOptions: {
                            wrapperClass: categoryClass,
                            label: engineMetricCategories.getNames(metric.categoryId).label
                        }, fieldGroup: [], wrapper: 'category'
                    };
                }
                categories[metric.categoryId].fieldGroup.push(field);

                $scope.metrics[metric.id] = field;
                if(!(metric.id in $scope.document.metrics))
                    $scope.document.metrics[metric.id] = null;
                //
                // if(self.showErrors)
                //     field.formControl.$validate();

            }
        });
        // console.log('categories');
        // console.log(categories);

        angular.forEach(categories, function (category) {
            $scope.documentFields.push(category);
        });

    };

    this.onChange = function () {

    };

    this._handleActionResonse = function (actionResponse) {
        if(actionResponse.type == 'REDIRECT') {
            //before redirecting, load document from engine to ascertain it's document type
            engineDocument.get(actionResponse.redirectToDocument, function (_data) {

                $location.path($engine.pathToDocument($engine.getOptions(_data.document.states.documentType),
                               actionResponse.redirectToDocument));

                //if redirecting to new document, clear steps
                if($scope.document.id != null && $scope.document.id != actionResponse.redirectToDocument)
                    $location.search({step: 0});
            });
        }
    };

    $scope.saveDocument = function(onSuccess, onError){


        var saveAction = engineActionUtils.getCreateUpdateAction(self.actions);

        if(saveAction)
            self.engineAction(saveAction, $scope.document, function (data) {
                if (onSuccess)
                    onSuccess(data);

                self._handleActionResonse(data);

            }, onError, undefined);
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
            $scope.saveDocument(function () {
                self.step = newStep;
            });
        }
        else {
            self.step = newStep;
        }
    };


    /**
     * Invokes engine action on the document, also broadcasts events to subcomponents
     *
     * @param {string} action
     * @param {object} document
     * @param {Function} callback
     * @param {Function} errorCallback
     */
    this.engineAction = function (action, document, callback, errorCallback) {

        var actionId = action.id;

        var eventBeforeAction = $scope.$broadcast('engine.common.action.before', new DocumentEventCtx(document, action));

        if(eventBeforeAction.defaultPrevented)
            return;

        if(engineActionUtils.isSaveAction(action)){
            var eventBeforeSave = $scope.$broadcast('engine.common.save.before', new DocumentEventCtx(document, action));

            if(eventBeforeSave.defaultPrevented)
                return;
        }

        //calls engineAction Service
        engineAction(actionId, document, function (data) {
            $scope.$broadcast('engine.common.action.after', new DocumentEventCtx(document, action));

            if(engineActionUtils.isSaveAction(action))
                $scope.$broadcast('engine.common.save.after', new DocumentEventCtx(document, action));

            if(callback)
                callback(data);

            self._handleActionResonse(data);

        }, function (response) {
            $scope.$broadcast('engine.common.action.error', new DocumentEventCtx(document, response));

            if(engineActionUtils.isSaveAction(action))
                $scope.$broadcast('engine.common.save.error', new DocumentEventCtx(document, action));

            if(errorCallback)
                errorCallback(response);
        }, self.parentDocumentId);
    };

    self.validateAll = function (event, dontShowErrors) {

        if(self.validatedSteps)
            for(var i=0; i < self.validatedSteps.length; ++i)
                self.validatedSteps[i] = 'loading';

        engineDocument.validate($scope.document, function (data) {
            console.log(data);
            self.form.form.$externalValidated = true;
            self.form.backendValidation = data;

            var _failedCategories = {};

            var _mentionedCategories = {};

            angular.forEach(self.form.backendValidation.results, function (metric) {
                var categoryId = self.allMetrics_d[metric.metricId].categoryId;
                if(metric.valid === false){
                    _failedCategories[categoryId] = true;
                }
                _mentionedCategories[categoryId] = true;

                if(!dontShowErrors)
                    if(metric.metricId in $scope.metrics && $scope.metrics[metric.metricId].formControl){
                        $scope.metrics[metric.metricId].validation.show = true;
                        $scope.metrics[metric.metricId].formControl.$validate();
                    }
            });

            angular.forEach($scope.steps, function (step, index) {
                angular.forEach(step.categories, function (category) {
                    if(category in _failedCategories)
                        self.validatedSteps[index] = 'invalid';
                    else if(!(category in _mentionedCategories) && self.validatedSteps[index] != 'invalid')
                        self.validatedSteps[index] = 'blank';

                })
            });

            if(self.validatedSteps){
                var _firstFailedStep = null;

                for(var i=0; i < self.validatedSteps.length; ++i){
                    if(self.validatedSteps[i] == 'loading') {
                        self.validatedSteps[i] = 'valid';
                    }
                    else if(_firstFailedStep === null)
                        _firstFailedStep = i;
                }

                if(!dontShowErrors && _firstFailedStep !== null) {
                    self.step = _firstFailedStep;
                    self.showErrors = true;
                }
            }


        }, function (response) {
            if(self.validatedSteps)
                for(var i=0; i < self.validatedSteps.length; ++i)
                    self.validatedSteps[i] = 'invalid';
        });
    };

    // $scope.$on('engine.common.step.before', function (event, newStep, oldStep) {
    //     $scope.onChangeStep(newStep, oldStep);
    // });
    //
    // $scope.$on('engine.common.step.change', function (event, newStep, oldStep) {
    //     $scope.onChangeStep(newStep, oldStep);
    // });
    $scope.$on('engine.common.document.validate', self.validateAll);

    $scope.$on('engine.common.action.invoke', function (event, action, callback) {
        self.engineAction(action, $scope.document, callback);
    });

    $q.all(this.stepList.$ready, this.documentForm.$ready).then(this.initDocument).then(function () {
        $log.debug('engineDocumentCtrl initialized: ', self);
    });
});