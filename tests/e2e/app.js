angular.module('engine-test-app', ['ngRoute', 'ui.select', 'engine', 'ngMockE2E', 'ui.bootstrap'])
    .config(function ($engineProvider) {
        $engineProvider.document('proposal', '/proposal', '/proposal/:id',
            'proposalQuery', {
                document: {
                    steps: [
                        {name: 'GENERAL', categories: ['Controls']},
                    ]
                },
                list: {
                    caption: "Proposals list",
                    columns: [
                        {'name': '@index', caption: 'ID', type: 'link'},
                    ]
                }
            });
        $engineProvider.setBaseUrl('/engine/rest');
    })
    .config(function ($routeProvider) {
        $routeProvider.otherwise('/proposal')
    })
    /**
     * handling list view
     */
    .run(function ($httpBackend) {
        var rdata = [200, JSON.parse(`{"data":[{"document":{"id":"59f31c95e4b0dd25f041642d","parentId":null,"states":{"documentType":"proposal","documentState":"draft"},"metrics":{"techEvalBox":"technicalEvaluationProposal","sampleBox":"sampelForProposal","safetyEvalBoxProposal":"safetyEvaluationProposal","radiationEvalBoxProposal":"radiationEvaluationProposal","expDescriptionPDF":null,"attachments":[],"teamID":26},"hasValidMetrics":false,"name":null,"isLeaf":true,"rootUuid":"SVFGxuizmb","slaUuid":"vofwxHlomT","team":"26","author":"1","createdAt":"2017-10-27T11:46:28.778","attributes":{},"relatedDocumentsForQuery":null,"submitter":null,"mainProposer":null},"actions":[{"id":"invalidateProposalCog","type":"DELETE","label":"invalidateProposalCog","visible":true,"reloadDocumentAfter":false,"attributes":null,"metricSource":"ALIAS","copyMetricsFromAlias":"BASE","copyNameFromAlias":null,"copyRelationsFromAlias":null,"copyStatesFromAlias":"BASE","setTeamFromAlias":"BASE","desiredId":null,"alias":"newLeaf","redirectToThisVersion":false,"redirectContext":null,"parentAlias":"BASE"}],"messages":[{"body":"<strong>Before you start, please remember, that</strong><hr /> <ol><li>to submit Proposal you need to have accepted Affiliation. <br /> To add new Affiliation choose from menu - Profile and Affiliations and then Add Affiliation button.</li><li>every new affiliation is verified by Solaris User Office Manager. <br />Verification may take several days so please don't wait until the last moment before sending Proposal!</li><li>you can add Co-Proposers to your Proposal, who will have access to the Proposal from their DUO accounts.</li><li>for each Co-Proposer you can add permissions to edit the Proposal.</li><li>add member to the Experimentalists team that will participate in experiment in Solaris (after proposal acceptation).</li></ol>","type":"info","id":"sampleMsg2","attributes":null},{"body":"Please remeber to choose open call for your proposal.","type":"danger","id":"opencallWarning","attributes":null},{"body":"Please remeber, that only samples in status validated will be taking into the consideration during evaluation process!","type":"warning","id":"sampleWarning","attributes":null}]}],"msg":null}`)];

        // :TODO where does that requests come from?
        $httpBackend.whenGET('/query?queryCategoryId=proposalQuery').respond((method, url, data) => rdata);
        $httpBackend.whenPOST('/action/available?documentId=').respond((method, url, data) => [200, {}]);

        // This makes sense
        $httpBackend.whenPOST('/query/documents-with-extra-data?queryId=proposalQuery&attachAvailableActions=true&otherDocumentId=&documentId=&skip=0&limit=50').respond((method, url, data) => rdata);
    })
    /**
     * Handling single document
     */
    .run(function ($httpBackend) {
        var rdataMetricCategories = [200,
            {
                "data": [{
                    "id": "Controls",
                    "label": "mcGeneralPart",
                    "position": 0,
                    "children": [{
                        "id": "Controls",
                        "label": "mcControls",
                        "position": 1,
                        "children": [],
                        "availableForStateValues": [],
                        "visualClass": ["category"]
                    }], "msg": null
                }]
            }
        ];

        $httpBackend.whenGET('/metric-categories').respond(() => rdataMetricCategories);

        var rdataDocument = [200, {
            "data": {
                "document": {
                    "id": "59f31c95e4b0dd25f041642d",
                    "parentId": null,
                    "states": {"documentType": "proposal", "documentState": "draft"},
                    "metrics": {
                        "date": null
                    },
                    "hasValidMetrics": false,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "SVFGxuizmb",
                    "slaUuid": "vofwxHlomT",
                    "team": "26",
                    "author": "1",
                    "createdAt": "2017-10-27T11:46:28.778",
                    "attributes": {},
                    "relatedDocumentsForQuery": null,
                    "submitter": null,
                    "mainProposer": null
                },
                "actions": [{
                    "id": "invalidateProposalCog",
                    "type": "DELETE",
                    "label": "invalidateProposalCog",
                    "visible": true,
                    "reloadDocumentAfter": false,
                    "attributes": null,
                    "metricSource": "ALIAS",
                    "copyMetricsFromAlias": "BASE",
                    "copyNameFromAlias": null,
                    "copyRelationsFromAlias": null,
                    "copyStatesFromAlias": "BASE",
                    "setTeamFromAlias": "BASE",
                    "desiredId": null,
                    "alias": "newLeaf",
                    "redirectToThisVersion": false,
                    "redirectContext": null,
                    "parentAlias": "BASE"
                }],
                "queries": null,
                "messages": [{
                    "body": "Sample Message",
                    "type": "info",
                    "id": "sampleMsg2",
                    "attributes": null
                }]
            }, "msg": null
        }];

        $httpBackend.whenPOST('/document/getwithextradata?documentId=59f31c95e4b0dd25f041642d&attachAvailableActions=true').respond(() => rdataDocument);

        var rdataActions = [200, {
            "data": [{
                "id": "updateProposal",
                "type": "UPDATE",
                "label": "labSaveProposal",
                "visible": true,
                "reloadDocumentAfter": false,
                "attributes": null,
                "documentAliasFrom": "TEMP",
                "documentAliasTo": "BASE",
                "metricIds": null
            }, {
                "id": "invalidateProposalEdit",
                "type": "DELETE",
                "label": "invalidateProposalCog",
                "visible": true,
                "reloadDocumentAfter": false,
                "attributes": null,
                "metricSource": "ALIAS",
                "copyMetricsFromAlias": "BASE",
                "copyNameFromAlias": null,
                "copyRelationsFromAlias": null,
                "copyStatesFromAlias": "BASE",
                "setTeamFromAlias": "BASE",
                "desiredId": null,
                "alias": "newLeaf",
                "redirectToThisVersion": true,
                "redirectContext": null,
                "parentAlias": "BASE"
            }], "msg": null
        }];

        $httpBackend.whenPOST('/action/available?documentId=59f31c95e4b0dd25f041642d').respond(() => rdataActions);

        var rdataMetrics = [200, {
            "data": [{
                "id": "textControl",
                "label": "textControl",
                "unit": null,
                "description": null,
                "required": true,
                "categoryId": "Controls",
                "position": 1,
                "defaultValue": null,
                "inputType": "TEXT",
                "visualClass": ["testVisualClass", "shortString"],
                "reloadOnChange": false,
                "validateOnChange": false,
                "saveOnChange": false,
                "reloadActionsOnChange": false,
                "visualConstraint": null,
                "nooverwrite": false
            },
            {
                "id": "dateControlStart",
                "label": "dateControlStart",
                "unit": null,
                "description": null,
                "required": true,
                "categoryId": "Controls",
                "position": 1,
                "defaultValue": null,
                "inputType": "DATE",
                "visualClass": ['date'],
                "reloadOnChange": false,
                "validateOnChange": false,
                "saveOnChange": false,
                "reloadActionsOnChange": false,
                "visualConstraint": null,
                "nooverwrite": false
            },
            {
                "id": "dateControlEnd",
                "label": "dateControlEnd",
                "unit": null,
                "description": null,
                "required": true,
                "categoryId": "Controls",
                "position": 1,
                "defaultValue": null,
                "inputType": "DATE",
                "visualClass": ['date'],
                "reloadOnChange": false,
                "validateOnChange": false,
                "saveOnChange": false,
                "reloadActionsOnChange": false,
                "visualConstraint": null,
                "nooverwrite": false
            }]
        }];

        $httpBackend.whenPOST('/metrics?documentId=59f31c95e4b0dd25f041642d').respond(() => rdataMetrics);

        var rValidate = [200, JSON.parse(`{"data":{"results":[],"valid":true},"msg":null}`)];
        $httpBackend.whenPOST('/validate-metric-values?documentId=59f31c95e4b0dd25f041642d').respond((type, request, data) => {
            data = JSON.parse(data);
            console.log(data);

            var r = angular.copy(rValidate);

            _.each(data.metrics, (metricVal, metricId) => {
                r[1].data.results.push({"metricId":metricId,"messages":[],"valid":true})
            });

            return r;
        });
    })
;
