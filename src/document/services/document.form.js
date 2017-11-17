angular.module('engine.document')
.factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, $q,
                                   DocumentCategoryFactory, $engineApiCheck, $engLog, DocumentValidator) {
    var _apiCheck = $engineApiCheck;

    /**
     *
     * @param documentScope - scope of the document component (all events will be called on this scope with $broadcast)
     * @constructor
     */
    function DocumentForm(documentScope) {
        assert(documentScope != null);
        this.documentScope = documentScope;
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.parentDocumentId = documentScope.$ctrl.parentDocument ? (documentScope.$ctrl.parentDocument.id || documentScope.$ctrl.parentDocument) : undefined;
        this.documentOptions = null;
        this.steps = null;
        this.disabled = false;
        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';
        this.formStructure = [];
        this.currentFormlyFields = [];
        this.formlyFields = [];
        this.validator = null;
        this.currentStep = null;
        this.categoriesDict = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {object}
         */
        // this.formlyState = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {{}}
         */
        // this.formlyOptions = {};
        this.formLoaded = false;
        this.markInit = null;
        var self = this;
        this.$validationReadyDeferred = $q.defer();
        this.$validationReady = this.$validationReadyDeferred.promise;
        this.$ready = $q(function (resolve, reject) {
            self.markInit = resolve;
        }).then(function(){
            return self._loadMetricCategories();
        });

        this.bindings = [];

        this.bindings.push(this.documentScope.$on('engine.common.save.after', function (event) {
            self.formlyState.$setPristine();
        }));

        this.bindings.push(this.documentScope.$on('engine.common.navigateAway', function (event) {
            if(self.formlyState.$dirty) {
                event.preventDefault();
            }
        }));
    }

    DocumentForm.prototype.$destroy = function $destroy() {
        _.each(this.bindings, function (binding) {
            binding();
        })
    };

    DocumentForm.prototype.loadForm = function loadForm() {
        var self = this;

        return this.$ready.then(function(){
            return self._loadMetrics();
        }).then(function(){
            self._makeForm();
            self.formLoaded = true;
        });
    };

    /**
     * INTERNAL FUNCTION, as it is callback from form controls, it does not have to check state of the form
     * IN FUTURE it may be made public, in which case check will have to be added in order to make sure, that
     * initial form has been loaded
     *
     * @returns {Promise<U>|Promise<R>}
     * @private
     */
    DocumentForm.prototype._reloadForm = function reloadForm() {
        var self = this;

        if(!this.formLoaded) {
            $engLog.error('DocumentForm._reloadForm called without waiting for DocumentForm.loadForm');
            throw new Error();
        }
        this.documentScope.$broadcast('document.form.reloadingMetrics.before');

        var options = { documentJSON: this.document };
        if (!!self.parentDocumentId) {
            options.otherDocumentId = self.parentDocumentId;
        }

        /**
         * Return promise to the engineMetric loading
         */
        return engineMetric(options, function (metricList) {
            $engLog.log('New loaded metrics: ', metricList);
            var metricDict = _.indexBy(metricList, 'id');

            var newMetrics = _.reject(metricList, function (metric) {
                return metric.id in self.metricDict;
            });

            $engLog.log('New metrics: ', newMetrics);

            //remove metrics, which are not present in metricList
            _.forEach(self.metricList, function (metric) {
                if(!(metric.id in metricDict)) {

                    var metricIndex = _.findIndex(self.categoriesDict[metric.categoryId].fieldGroup, function (field) {
                        return field.data.id == metric.id;
                    });
                    if(metricIndex == -1)
                        return;

                    $engLog.log('Metric to remove: ', metric, 'index: ', metricIndex);

                    delete self.steps.getCurrentStep().fields[metric.id];
                    delete self.metricDict[metric.id];
                    self.categoriesDict[metric.categoryId].fieldGroup.splice(metricIndex, 1);
                    delete self.document.metrics[metric.id];
                }
            });

            self.setDefaultMetricValues(newMetrics);

            //add new metrics to the form, with respect to position
            _.forEach(newMetrics, function (newMetric) {
                $engLog.log(self.categoriesDict[newMetric.categoryId]);
                self.addMetric(newMetric);
                var field = DocumentFieldFactory.makeField(self.metricList, newMetric, {document: self.document,
                                                                                        options: self.documentOptions,
                                                                                        documentForm: self});
                self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 0, field);

                self.categoriesDict[newMetric.categoryId].fieldGroup = _.sortBy(self.categoriesDict[newMetric.categoryId].fieldGroup, function (metric) {
                    return metric.data.position;
                });

                for(var i = 0; i < self.steps.getSteps().length; ++i) {
                    var step = self.steps.getStep(i);
                    if (self.categoriesDict[field.data.categoryId] === undefined) {
                        $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                            'field', field, 'categoryId', field.data.categoryId);
                        continue;
                    }
                    if (step.metrics[field.data.categoryId] === undefined)
                        continue;

                    step.fields[field.data.id] = field;
                    break;
                }
            });

            // Notify document and every element under it that metrics have been reladed
            self.documentScope.$broadcast('document.form.reloadingMetrics.after');
        }).$promise;
    };

    DocumentForm.prototype.connectFieldToStep = function (newMetrics) {
        var self = this;
        var _categoriesToPostProcess = [];
        newMetrics = (typeof newMetrics === 'undefined') ? self.metricList : newMetrics;

        self.setDefaultMetricValues(newMetrics);

        _.forEach(newMetrics, function (newMetric) {
            $engLog.log(self.categoriesDict[newMetric.categoryId]);
            self.addMetric(newMetric);

            var field = DocumentFieldFactory.makeField(self.metricList, newMetric, {
                document: self.document,
                options: self.documentOptions,
                documentForm: self
            });

            if (newMetric.categoryId in self.categoriesDict) {
                //  field do not duplicate
                // :TODO Make it prettier
                if (!_.find(self.fieldList, field => field.key === newMetric.id)) {
                    self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 1);
                    self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 0, field);
                    self.categoriesDict[newMetric.categoryId].fieldGroup = _.sortBy(self.categoriesDict[newMetric.categoryId].fieldGroup, function (metric) {
                        return metric.data.position;
                    });
                }
            }

        });

        self._setSteps(self.steps);
        self.setFormlyState(self.formlyState);

        _.forEach(self.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory(step);
            formStepStructure.fieldGroup = _parseMetricCategories(step, step.metricCategories);
            self.formStructure.push(formStepStructure);
        });

        _.forEach(self.steps.getSteps(), function (step) {
            _.forEach(self.fieldList, function (field) {

                if (self.categoriesDict[field.data.categoryId] === undefined) {
                    $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                        'field', field, 'categoryId', field.data.categoryId);
                    return ;
                }
                if (step.metrics[field.data.categoryId] === undefined)
                    return;
                if (_.contains(self.fields, field))
                    self.fields = _.without(self.fields)
                self.categoriesDict[field.data.categoryId].fieldGroup.push(field);
                step.fields[field.data.id] = field;

            });
        });

        postprocess();

        reorderFields();

        function _parseMetricCategories(step, metricCategories) {
            var formCategories = [];
            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, {document: self.document});

                formMetricCategory.fieldGroup =_parseMetricCategories(step, metricCategory.children);

                self.categoriesDict[metricCategory.id] = formMetricCategory;
                step.metrics[metricCategory.id] = formMetricCategory;
                if(_.isFunction(formMetricCategory.data.$process))
                    _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            })
        }

        function reorderFields() {
            _.forEach(self.categoriesDict, function (metricCategory) {
                metricCategory.fieldGroup = _.sortBy(metricCategory.fieldGroup, function (field) {
                    return field.data.position;
                });
            });
        }
    }


    DocumentForm.prototype.addMetric = function addMetric(metric) {
        if(metric.id in this.metricDict)
            return;

        this.metricList.push(metric);
        this.metricDict[metric.id] = metric;
    };

    DocumentForm.prototype._loadMetricCategories = function loadMetricCategories() {
        var self = this;

        return engineMetricCategories.then(function (metricCategories) {
            self.metricCategories = metricCategories;
        });
    };
    DocumentForm.prototype._setDocument = function setDocument(document) {
        if(this.document != null) {
            this.document = document;
            // model must be rebound for every field in form
            _.forEach(this.fieldList, function (field) {
                field.model = document.metrics;
                if (field.data.prepareValue)
                    document.metrics[field.key] = field.data.prepareValue(document.metrics[field.key]);
            });
        }
        else
            this.document = document;
    };

    DocumentForm.prototype._setActions = function setActions(actions) {
        this.actions = actions;
    };
    DocumentForm.prototype._setOptions = function setOptions(documentOptions) {
        this.documentOptions = documentOptions;
    };
    DocumentForm.prototype._setSteps = function setSteps(steps) {
        this.steps = steps;

        _.forEach(this.steps.getSteps(), function (step) {
            _.forEach(step.metricCategories, function (metricCategory) {
                if(_.isArray(metricCategory.visualClass))
                    metricCategory.visualClass.push('category');
                else
                    metricCategory.visualClass = ['category'];
            })
        })
    };
    DocumentForm.prototype.init = function init(document, options, steps, actions, formlyState, formlyOptions) {
        _apiCheck([_apiCheck.object,
            _apiCheck.object,
            _apiCheck.arrayOf(_apiCheck.object),
            _apiCheck.object,
            _apiCheck.object], arguments);

        this._setDocument(document);
        this._setOptions(options);
        this._setSteps(steps);
        this._setActions(actions);
        this.setFormlyState(formlyState);
        this.formlyOptions = formlyOptions;
        this.markInit();
    };


    DocumentForm.prototype.setValidator = function (validator) {
        this.validator = validator;
        this.$validationReadyDeferred.resolve();
    }
    DocumentForm.prototype.setFormlyState = function (formlyState) {
        this.formlyState = formlyState;
        if(this.formlyState != null) {
            this.setValidator(new DocumentValidator(this.document, this.parentDocumentId, this.steps, this.formlyState));
        }
    };

    DocumentForm.prototype.setFormlyOptions = function (formlyOptions) {
        this.formlyOptions = formlyOptions;
    };

    DocumentForm.prototype.setEditable = function setEditable(editable) {
        this.disabled = !editable;
    };

    DocumentForm.prototype.isEditable = function isEditable() {
        return !this.disabled;
    };

    DocumentForm.prototype.setStep = function setStep(step) {
        this.currentFormlyFields = this.formStructure[step];

        if(this.currentStep != null)
            this.formStructure[this.currentStep].data.hide = true;

        this.currentStep = step;
        this.formStructure[this.currentStep].data.hide = false;
        $engLog.debug('current fields to display in form', this.currentFormlyFields);
    };

    DocumentForm.prototype._assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document'+message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions'+message);
        assert(this.steps != null, 'DocumentForm.steps'+message);
        assert(this.actions != null, 'DocumentForm.actions'+message);
    };

    DocumentForm.prototype._onReload = function onReload() {
        $engLog.debug('Form reload called');
        this._reloadForm();
    };

    DocumentForm.prototype._makeForm = function makeForm() {
        var self = this;

        $engLog.log('DocumentForm._makeForm', self.fieldList);
        self._assertInit();

        assert(self.metricList.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetrics');
        assert(self.metricCategories.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetricCategories');

        var _categoriesToPostProcess = [];

        _.forEach(self.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory(step);
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
        });
        _.forEach(self.steps.getSteps(), function (step) {
            connectFields(step);
        });

        postprocess();

        reorderFields();

        if(self.formlyState != null)
            self.setValidator(new DocumentValidator(self.document, self.parentDocumentId, self.steps, self.formlyState));

        $engLog.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(step, metricCategories) {
            var formCategories = [];
            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, {document: self.document});

                formMetricCategory.fieldGroup = parseMetricCategories(step, metricCategory.children);

                self.categoriesDict[metricCategory.id] = formMetricCategory;
                step.metrics[metricCategory.id] = formMetricCategory;
                if(_.isFunction(formMetricCategory.data.$process))
                    _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields(step) {
            _.forEach(self.fieldList, function (field) {
                if(self.categoriesDict[field.data.categoryId] === undefined){
                    $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                              'field', field, 'categoryId', field.data.categoryId);
                    return;
                }
                if(step.metrics[field.data.categoryId] === undefined)
                    return;

                self.categoriesDict[field.data.categoryId].fieldGroup.push(field);
                step.fields[field.data.id] = field;
            });
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            })
        }

        function reorderFields() {
            _.forEach(self.categoriesDict, function (metricCategory) {
                metricCategory.fieldGroup = _.sortBy(metricCategory.fieldGroup, function (field) {
                    return field.data.position;
                });
            });
        }
    };

    DocumentForm.prototype.setDefaultMetricValues = function (metrics) {
        var self = this;
        metrics.forEach(function (metric) {
            if (!!metric.defaultValue && !self.document.metrics[metric.id]) {
                self.document.metrics[metric.id] = metric.defaultValue;
            }
        });
    };

    DocumentForm.prototype._updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, {document: this.document, options: this.documentOptions, documentForm: this});
    };

    DocumentForm.prototype._loadMetrics = function loadMetrics() {
        var self = this;
        var options = { documentJSON: this.document };
        if (!!self.parentDocumentId) {
            options.otherDocumentId = self.parentDocumentId;
        }

        return engineMetric(options, function (metricList) {
            self.metricList = metricList;
            self.metricDict = _.indexBy(self.metricList, 'id');
            self.setDefaultMetricValues(self.metricList);
            self._updateFields(self.metricList);
        }).$promise;
    };

    DocumentForm.prototype.prepareMetrics = function () {
        console.log(this);
    };

    DocumentForm.prototype.validateCurrentStep = function validateCurrentStep(fillNull) {
        var self = this;
        return this.$validationReady.then(function () {return self.validator.validate(self.currentStep, fillNull);});
    };

    DocumentForm.prototype.validate = function validate(step, fillNull) {
        var self = this;
        return this.$validationReady.then(function() {return self.validator.validate(step, fillNull);});
    };

    return DocumentForm;
});
