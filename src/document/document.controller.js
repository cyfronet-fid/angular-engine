angular.module('engine.document')
.component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '=',
        options: '=',
        steps: '=',
        step: '=',
        documentId: '@'
    }
})
.controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams) {
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    $scope.step = parseInt($routeParams.step) || 0;
    $scope.document = {};
    $scope.documentId = $routeParams.id;

    $scope.changeStep = function (step) {
        $scope.$broadcast('engine.common.step.before', step);
    }
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
    $scope.step = this.step;
    //if categoryGroup (string) will be overriten in this.init()
    $scope.currentCategories = $scope.steps == null || (angular.isArray($scope.steps) && $scope.steps.length == 0) ? [] : $scope.steps[$scope.step].categories || [];

    this.init = function () {
        return engineMetricCategories.then(function (data) {
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
            else {
                $scope.document = angular.copy(self.options.documentJSON);
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

    this.loadMetrics = function () {
        $scope.metrics = engineMetric(self.options.documentJSON, function (data) {

            var categories = {};

            angular.forEach(data, function (metric) {
                // console.log(metric)
                if($scope.steps == null || $scope.currentCategories.indexOf(metric.categoryId) != -1) {
                    var field = {
                        model: $scope.document.metrics,
                        key: metric.id,
                        type: 'input',
                        className: metric.visualClass.join(' '),
                        templateOptions: {
                            type: 'text',
                            label: metric.label,
                            description: metric.description,
                            placeholder: 'Enter '+metric.label
                        },
                        expressionProperties: {
                            'templateOptions.disabled': self.isDisabled
                        }
                    };

                    if(_.contains(metric.visualClass, 'select')) {
                        field.type = 'select';
                        field.templateOptions.options = _engineOptionsToFormly(metric.options);
                    }
                    else if(_.contains(metric.visualClass, 'radioGroup')) {
                        field.type = 'radio';
                        field.templateOptions.options = _engineOptionsToFormly(metric.options);
                    }
                    else if(_.contains(metric.visualClass, 'date') && metric.inputType == 'DATE') {
                        field.type = 'datepicker';
                    }
                    else if(_.contains(metric.visualClass, 'checkbox')) {
                        field.type = 'checkbox';
                    }
                    else if(metric.inputType == 'NUMBER') {
                        field.type = 'input';
                    }
                    else if(metric.inputType == 'TEXTAREA') {
                        field.type = "textarea";
                        field.templateOptions = {
                            "placeholder": "",
                            "label": "",

                            //these needs to be specified somewhere?
                            "rows": 4,
                            "cols": 15
                        }
                    }
                    else if(metric.inputType == 'EXTERNAL') {
                        field = {template: '<'+metric.externalType+' ng-model="options.templateOptions.ngModel" options="options.templateOptions.options" class="'+metric.visualClass.join(' ')+'">'+'</'+metric.externalType+'>',
                            templateOptions: {ngModel: $scope.document, options: self.options}, expressionProperties: {'templateOptions.disabled': self.isDisabled}}
                    }
                    else if(metric.inputType == 'QUERIED_LIST') {
                        field.type = undefined;
                        field.model = undefined;
                        field = {template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="'+metric.visualClass.join(' ')+'" ' +
                                           ' query="\''+metric.queryId+'\'" show-create-button="'+metric.showCreateButton+'"></engine-document-list>',
                            templateOptions: {options: $engine.getOptions(metric.modelId),
                                              document: $scope.document
                        }, expressionProperties: {'templateOptions.disabled': self.isDisabled}
                        }
                    }

                    if(categories[metric.categoryId] == undefined)
                        categories[metric.categoryId] = {templateOptions: {wrapperClass: categoryClass, label: metric.categoryId}, fieldGroup: [], wrapper: 'category'};

                    categories[metric.categoryId].fieldGroup.push(field);

                }
            });
            // console.log('categories');
            // console.log(categories);

            angular.forEach(categories, function (category) {
                $scope.documentFields.push(category);
            });

        });
    };

    this.onChange = function () {

    };

    $scope.isLastStep = function (step) {
        if($scope.steps == null || parseInt(step) == $scope.steps.length)
            return true;
    };

    $scope.documentFields = [

    ];

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

    $scope.onChangeStep = function (newStep) {
        if(self.isEditable())
            $scope.saveDocument(function () {
                $routeParams.step = newStep;
                $location.search({step: newStep})
            });
        else {
            $routeParams.step = newStep;
            $location.search({step: newStep})
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

    $scope.$on('engine.common.step.before', function (event, newStep) {
        $scope.onChangeStep(newStep);
    });

    $scope.$on('engine.common.step.change', function (event, newStep) {
        $scope.onChangeStep(newStep);
    });

    $scope.$on('engine.common.action.invoke', function (event, action) {
        self.engineAction(action, $scope.document);
    });

    this.init();
});