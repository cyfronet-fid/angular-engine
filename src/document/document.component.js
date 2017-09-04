var app = angular.module('engine.document')
app.component('engineDocument', {
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
        parentDocument: '=',
        dirty: '=',
        processing: '=?',
        documentScope: '='
    }
});
app.controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument,
                                               engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx,
                                               engineAction, engineMetricCategories, StepList, DocumentForm,
                                               DocumentActionList, $q, $engLog, $attrs, Step, $parse) {
    var self = this;

    $engLog.debug($scope);

    this.$onInit = function () {
        this.document = null;
        // providing this binding is not required, so we have to check it it's defined
        if ($parse($attrs['documentScope']).assign === true)
            self.documentScope = $scope;
        $scope.steps = this.options.document.steps;
        this.processing = false;
        this.actionList = null;
        this.documentForm = new DocumentForm($scope);
        this.dirty = false;

        $scope.$on('engine.common.document.requestReload', function (event) {
            $engLog.debug('request reload for document');
            event.reloadPromise = self.getDocument(true).then(function () {
                self.documentForm._setDocument(self.document);
                self.actionList._setDocument(self.document);
            });
        });

        $scope.$on('engine.common.document.validate', function (event) {
            event.$promise = self.documentForm.validate(null, true).then(function (valid) {
                if (!valid)
                    self.step = self.stepList.getFirstInvalidIndex();
            });
        });

        $scope.$on('engine.common.document.requestSave', function (event) {
            event.savePromise = self.save();
        });

        $scope.$on('engine.common.action.after', function (event, document, action, result) {

        });

        this.$ready = this.getDocument()
            .then(function () {
                return $q.all(self.stepList.$ready, self.documentForm.$ready)
            })
            .then(this.initDocument)
            .then(this.postinitDocument)
            .then(function () {
                $engLog.debug('engineDocumentCtrl initialized: ', self);
                $engLog.log(self.$ready.$$state.status);
            }).then(this.validateAfterInit);
        $engLog.log(this.$ready.$$state.status);
    };


    $scope.$watch('$ctrl.documentForm.formlyState.$dirty', function (newValue, oldValue) {
        self.dirty = newValue;
    });

    this.getDocument = function (noReloadSteps) {
        var _actionsToPerform = [];
        //if the document exists, the first action will be retrieving it
        if (self.documentId && self.documentId != 'new') {
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (data) {
                self.document = data.document;
                self.messages = data.messages;
                // self.documentChange(self.document);
            }));
        } //if document does not exist copy base from options, and set the name
        else {
            self.document = angular.copy(self.options.documentJSON);
            self.document.name = (self.options.name || 'Document') + ' initiated on ' + (new Date());
        }
        return $q.all(_actionsToPerform).then(function () {
            if (!noReloadSteps)
                self.stepList.setDocument(self.document);
        });
    };
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
        // assert(self.documentForm.$ready, message);

        self.stepList.setCurrentStep(self.step);

        // return chained promise, which will do all other common required operations:
        self.actionList = new DocumentActionList(null, self.document, self.parentDocument, $scope);
        return self.actionList.$ready.then(function () {
            //assign actions only if binding is present
            if ($attrs.actions)
                self.actions = self.actionList;
            self.documentForm.init(self.document, self.options, self.stepList, self.actionList);
            //load metrics to form
            return self.documentForm.loadForm();
        });
    };

    /**
     * This method is called after whole document was initiated,
     * here all $watch, and other such methods should be defined
     */
    this.postinitDocument = function postinitDocument() {

        if (self.actionList.getSaveAction() == null)
            self.documentForm.setEditable(false);

        $scope.$watch('$ctrl.step', self.onStepChange);
    };

    this.onStepChange = function (newStep, oldStep) {
        if (newStep != oldStep) {
            if (self.documentForm.isEditable()) {
                self.documentForm.validate(oldStep, true);
                self.save();
            }
        }
        self.stepList.setCurrentStep(newStep);
        self.documentForm.setStep(newStep);
    };

    this.save = function () {
        self.processing = true;
        return self.actionList.callSave().finally(function () {
            self.processing = false;
        });
    };

    this.validateAfterInit = function validateAfterInit() {
        var stepsToValidate = [];
        var currentStep = self.stepList.getCurrentStepIndex();

        for (i = 0; i < currentStep; i++) {
            if (self.stepList.getStep(i).getState() == Step.STATE_BLANK) {
                stepsToValidate.push(i);
            }
        }

        self.documentForm.validate(stepsToValidate, true);
    };
});
