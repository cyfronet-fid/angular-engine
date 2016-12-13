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
        documentId: '@'
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
                                            engineAction, engineMetricCategories) {
    var self = this;
    console.log($scope);
    $scope.documentScope = $scope;
    $scope.document = {};
    $scope.steps = this.options.document.steps;
    $scope.actions = [];
    $scope.metrics = {};
    this.allMetrics_d = {};
    this.showErrors = false;

    this.form = {
        form: {},
        options: {},
        backendValidation: {}
    };

    //if categoryGroup (string) will be overriten in this.init()
    $scope.currentCategories = $scope.steps == null || (angular.isArray($scope.steps) && $scope.steps.length == 0) ? [] : $scope.steps[self.step].categories || [];

    this.init = function () {
        return engineMetricCategories.then(function (data) {
            engineMetricCategories = data;

            if (angular.isArray(self.options.document.steps)) {
                angular.forEach(self.options.document.steps, function (step) {
                    if (!angular.isArray(step.categories)) {
                        var _categoryGroup = step.categories;
                        step.categories = [];
                        angular.forEach(data.metrics[_categoryGroup].children, function (category) {
                            step.categories.push(category.id);
                        });
                        $scope.currentCategories = step.categories;
                    }
                })
            }

            if(self.documentId && self.documentId != 'new') {
                engineDocument.get(self.documentId, function (data) {
                    $scope.document = data.document;
                    $scope.actions = engineActionsAvailable.forDocument($scope.document);
                    self.loadMetrics();
                });
            }
            else { //this is new document
                $scope.document = angular.copy(self.options.documentJSON);
                $scope.document.name = (self.options.name || 'Document') + ' initiated on ' + (new Date());
                $scope.actions = engineActionsAvailable.forDocument($scope.document);
                self.loadMetrics();
            }
        });
    };

    this.isEditable = function () {
        if(engineActionUtils.getCreateUpdateAction($scope.actions) != null)
            return true;
        return false;
    };
    this.isDisabled = function () {
        return !self.isEditable();
    };

    function _engineOptionsToFormly(engineOptions) {
        var r = [];
        angular.forEach(engineOptions, function (option) {
            r.push({name: option.value, value: option.value})
        });
        return r;
    }

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
                var field = {
                    model: $scope.document.metrics,
                    key: metric.id,
                    type: 'input',
                    className: metric.visualClass.join(' '),
                    templateOptions: {
                        type: 'text',
                        label: metric.label,
                        description: metric.description,
                        placeholder: 'Enter ' + metric.label,
                        required: metric.required
                    },
                    expressionProperties: {
                        'templateOptions.disabled': self.isDisabled
                    },
                    validators: {
                        engineValid: {
                            expression: function ($viewValue, $modelValue, scope) {
                                //no backend validation yet
                                if (_.isEmpty(self.form.backendValidation))
                                    return true;

                                if (self.form.backendValidation.valid)
                                    return true;

                                if (metric.id in self.form.backendValidation.results &&
                                    !self.form.backendValidation.results[metric.id].valid)
                                    return false;

                                return true;
                            },
                            message: '"THIS IS WRONG!"'
                        }
                    },
                    validation: {
                        show: self.showErrors,
                        messages: {
                            required: 'to.label+"_required"'
                        }
                    }
                };

                if (_.contains(metric.visualClass, 'select')) {
                    field.type = 'select';
                    field.templateOptions.options = _engineOptionsToFormly(metric.options);
                }
                else if (_.contains(metric.visualClass, 'radioGroup')) {
                    field.type = 'radio';
                    field.templateOptions.options = _engineOptionsToFormly(metric.options);
                }
                else if (_.contains(metric.visualClass, 'date') && metric.inputType == 'DATE') {
                    field.type = 'datepicker';
                }
                else if (_.contains(metric.visualClass, 'checkbox')) {
                    field.type = 'checkbox';
                }
                else if (metric.inputType == 'NUMBER') {
                    field.type = 'input';
                }
                else if (metric.inputType == 'TEXTAREA') {
                    field.type = "textarea";
                    field.templateOptions.rows = 4;
                    field.templateOptions.cols = 15;
                }
                else if (metric.inputType == 'EXTERNAL') {
                    field = {
                        template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' +
                        'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                        'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                        templateOptions: {ngModel: $scope.document, options: self.options},
                        expressionProperties: {'templateOptions.disabled': self.isDisabled}
                    }
                }
                else if (metric.inputType == 'QUERIED_LIST') {
                    field.type = undefined;
                    field.model = undefined;
                    field = {
                        template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                        ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '"></engine-document-list>',
                        templateOptions: {
                            options: $engine.getOptions(metric.modelId),
                            document: $scope.document
                        }, expressionProperties: {'templateOptions.disabled': self.isDisabled}
                    }
                }

                if (metric.reloadOnChange) {
                    //make reload listener
                }

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

    this.loadMetrics = function () {
        engineMetric(self.options.documentJSON, function (data) {
            self.allMetrics = data;

            angular.forEach(self.allMetrics, function (metric) {
                self.allMetrics_d[metric.id] = metric;
            });

            var _init = false;

            $scope.$watch('$ctrl.step', function (newVal, oldVal) {
                if(newVal != oldVal)
                    $scope.onChangeStep(newVal, oldVal);
                self.generateFormFields();
                if(_init == false && self.documentId) {
                    self.validateAll(null, true);
                    _init = true;
                }
            });

        });
    };

    this.onChange = function () {

    };

    $scope.isLastStep = function (step) {
        if($scope.steps == null || parseInt(step) == $scope.steps.length)
            return true;
    };

    // var categoryClass = options.document.categoryClass || 'text-box';
    var categoryClass = 'text-box';;


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


        var saveAction = engineActionUtils.getCreateUpdateAction($scope.actions);

        if(saveAction)
            self.engineAction(saveAction, $scope.document, function (data) {
                if(onSuccess)
                    onSuccess(data);

                self._handleActionResonse(data);

            }, onError);
    };

    $scope.onChangeStep = function (newStep, oldStep) {
        if(self.isEditable()) {
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
        });
    };

    self.validateAll = function (event, dontShowErrors) {

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


        }, function (response) {
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

    $scope.$on('engine.common.action.invoke', function (event, action) {
        self.engineAction(action, $scope.document);
    });

    this.init();
});