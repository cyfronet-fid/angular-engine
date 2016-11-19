angular.module('engine.document')
.component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '=',
        options: '=',
        steps: '=',
        step: '='
    }
})
.controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams, engineAction) {
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    $scope.step = parseInt($routeParams.step) || 0;
    $scope.document = {};

    $scope.changeStep = function (step) {
        $location.search({step: step})
    }
})
.controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, engineAction, engineDocument, $location) {
    var self = this;
    console.log($scope);

    $scope.steps = this.options.document.steps;

    $scope.step = this.step;
    $scope.currentCategories = $scope.steps == null ? [] : $scope.steps[$scope.step].categories || [];

    if($scope.documentId && $scope.documentId != 'new') {
        $scope.document = engineDocument.get($scope.documentId);
    }

    $scope.engineAction = function (actionId, document) {
        engineAction(actionId, document);
    };

    $scope.isLastStep = function (step) {
        if($scope.steps == null || parseInt(step) == $scope.steps.length)
            return true;
    };

    $scope.documentFields = [

    ];

    // var categoryClass = options.document.categoryClass || 'text-box';
    var categoryClass = 'text-box';

    $scope.metrics = engineMetric(self.options.documentJSON, function (data) {
        if($scope.step == 0) {
            var generalGroup = {templateOptions: {wrapperClass: categoryClass, label: null}, fieldGroup: [],  wrapper: 'category'};
            generalGroup.fieldGroup.push({
                key: 'name',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'Name',
                    placeholder: 'Enter name'
                }
            });
            generalGroup.fieldGroup.push({
                key: 'id',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'id',
                    disabled: true
                }
            });
            $scope.documentFields.push(generalGroup);
        }

        // console.log(data);

        function engineOptionsToFormly(engineOptions) {
            var r = [];
            angular.forEach(engineOptions, function (option) {
                r.push({name: option.value, value: option.value})
            });
            return r;
        }
        var categories = {};
        angular.forEach(data, function (metric) {
            // console.log(metric)
            if($scope.steps == null || $scope.currentCategories.indexOf(metric.categoryId) != -1) {
                var field = {
                    key: metric.id,
                    type: 'input',
                    className: metric.visualClass.join(' '),
                     templateOptions: {
                         type: 'text',
                        label: metric.label,
                        placeholder: 'Enter '+metric.label
                     }
                };

                if(metric.visualClass.indexOf('select') != -1) {
                    field.type = 'select';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                }
                else if(metric.visualClass.indexOf('radioGroup') != -1) {
                    field.type = 'radio';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                }
                else if(metric.visualClass.indexOf('date') != -1 && metric.inputType == 'DATE') {
                    field.type = 'datepicker';
                }
                else if(_.contains(metric.visualClass, 'checkbox')) {
                    field.type = 'checkbox';
                }
                else if(metric.inputType == 'NUMBER') {

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
                else if(metric.inputType == 'COMPONENT') {
                    field = {template: '<'+metric.componentType+'>'+'</'+metric.componentType+'>', templateOptions: {ngModel: $scope.document}}
                }
                else if(metric.inputType == 'DOCUMENT') {
                    field = {template: '<engine-document-list query="'+metric.query+'" document-type="'+metric.documentType+'"></engine-document-list>', templateOptions: {ngModel: $scope.document}}
                }

                if(categories[metric.categoryId] == undefined)
                    categories[metric.categoryId] = {templateOptions: {wrapperClass: categoryClass, label: metric.categoryId}, fieldGroup: [],
                        wrapper: 'category'};
                if(metric.label == 'labFinancialSupport')
                    console.log(metric);
                categories[metric.categoryId].fieldGroup.push(field);

            }
        });
        // console.log('categories');
        // console.log(categories);

        angular.forEach(categories, function (category) {
            $scope.documentFields.push(category);
        });

    });

    $scope.document = {};


    $scope.changeStep = function (newStep) {
        $routeParams.step = newStep;
        $location.search({step: newStep})
    }
});