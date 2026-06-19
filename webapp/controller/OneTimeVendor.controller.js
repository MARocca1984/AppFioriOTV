sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, NumberFormat, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("vendorapp.controller.OneTimeVendor", {

        onInit: function () {
            this._numberFormat = NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 0,
                maxFractionDigits: 2
            });

            var oModel = new JSONModel(this._getEmptyData());
            this.getView().setModel(oModel, "vm");
            this._recalcTotals();

            // Reset the form every time the user enters the "Create OTV" screen
            this.getOwnerComponent().getRouter()
                .getRoute("oneTimeVendor")
                .attachPatternMatched(this._resetAll, this);
        },

        /* ---------- Data templates ---------- */

        _getEmptyForm: function () {
            return {
                companyCode: "",
                paymentDate: "",
                documentDate: "",
                receivedDate: "",
                baselineDate: "",
                exceptionReason: "Statutory/Tax",
                invoiceInformation: "",
                paymentMethod: "M",
                payeeName: "",
                payeeCity: "",
                invoiceAmount: "",
                taxAmount: "",
                docType: "",
                sapVendor: "",
                paymentCurrency: "MXN",
                cashClearingGL: "",
                valueDate: "",
                clearingText: "",
                preparedBy: ""
            };
        },

        _getEmptyData: function () {
            return {
                fileUploaded: false,
                form: this._getEmptyForm(),
                items: [this._getEmptyItem()],
                totalDebit: "0",
                totalCredit: "0"
            };
        },

        _getEmptyItem: function () {
            return {
                postingKey: "40 - Debit",
                glAccount: "",
                debit: "",
                credit: "",
                taxCode: "",
                costCtr: "",
                wbsElement: "",
                profitCtr: "",
                companyCode: "",
                text: ""
            };
        },

        /* ---------- Totals ---------- */

        _toNumber: function (vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return 0;
            }
            var fParsed = parseFloat(String(vValue).replace(/[^0-9.\-]/g, ""));
            return isNaN(fParsed) ? 0 : fParsed;
        },

        _recalcTotals: function () {
            var oModel = this.getView().getModel("vm");
            var aItems = oModel.getProperty("/items") || [];
            var fDebit = 0;
            var fCredit = 0;

            aItems.forEach(function (oItem) {
                fDebit += this._toNumber(oItem.debit);
                fCredit += this._toNumber(oItem.credit);
            }.bind(this));

            oModel.setProperty("/totalDebit", this._numberFormat.format(fDebit));
            oModel.setProperty("/totalCredit", this._numberFormat.format(fCredit));
        },

        onRecalc: function () {
            this._recalcTotals();
        },

        /* ---------- Attachment (mandatory gate) ---------- */

        onFileAdded: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            // Keep a reference to the raw File/Blob so it can be sent to DMS later.
            this._uploadedFile = oItem.getFileObject();
            // Keep the form hidden until the (simulated) upload reaches 100%.
            this.getView().getModel("vm").setProperty("/fileUploaded", false);
            this._startUpload(oItem);
        },

        _startUpload: function (oItem) {
            var oModel = this.getView().getModel("vm");
            var iProgress = 0;

            if (this._uploadTimer) {
                clearInterval(this._uploadTimer);
            }

            oItem.setUploadState("Uploading");
            oItem.setProgress(0);

            this._uploadTimer = setInterval(function () {
                iProgress += 5;

                if (iProgress >= 100) {
                    oItem.setProgress(100);
                    clearInterval(this._uploadTimer);
                    this._uploadTimer = null;
                    oItem.setUploadState("Complete");
                    oModel.setProperty("/fileUploaded", true);
                    MessageToast.show("Upload complete.");
                } else {
                    oItem.setProgress(iProgress);
                }
            }.bind(this), 70);
        },

        /**
         * Sends the attached file to DMS. Returns a Promise so the submit can wait for it
         * and abort on failure.
         *
         * TEMPORARY: the body resolves successfully because the DMS repository is not
         * configured yet. Replace the mock line with the real CMIS implementation below
         * (commented) once the repository is ready.
         *
         * SAP DMS exposes a CMIS REST API per repository. A document is created with a
         * multipart "createDocument" call against the repository root (or a target folder),
         * usually reached through a BTP destination (e.g. "/dms") routed by the approuter.
         */
        _sendFileToDMS: function (oFile) {
            // ----- TEMPORARY DEMO (no DMS yet): simulate a successful upload -----
            return Promise.resolve();
            // To exercise the failure path during the demo, temporarily use instead:
            // return Promise.reject(new Error("DMS repository is not configured yet"));

            /* ----- REAL IMPLEMENTATION (uncomment when the DMS repository is configured) -----
            if (!oFile) { return Promise.reject(new Error("No file to upload")); }

            var sRepositoryId = "<DMS_REPOSITORY_ID>";              // provided once DMS is configured
            var sTargetUrl    = "/dms/browser/" + sRepositoryId + "/root";  // root folder (or a folderId)

            var oFormData = new FormData();
            oFormData.append("cmisaction", "createDocument");
            oFormData.append("propertyId[0]", "cmis:objectTypeId");
            oFormData.append("propertyValue[0]", "cmis:document");
            oFormData.append("propertyId[1]", "cmis:name");
            oFormData.append("propertyValue[1]", oFile.name);
            oFormData.append("succinct", "true");
            oFormData.append("content", oFile, oFile.name);        // the binary content

            return fetch(sTargetUrl, {
                method: "POST",
                body: oFormData
                // CSRF/auth headers are usually injected by the BTP destination / approuter.
            }).then(function (oResponse) {
                if (!oResponse.ok) {
                    throw new Error("DMS upload failed with status " + oResponse.status);
                }
                return oResponse.json();
            }).then(function (oResult) {
                // oResult.succinctProperties["cmis:objectId"] => store this DMS objectId in
                // the header record (ZT_DATAC_OTV) so the attachment can be retrieved later.
                return oResult;
            });
            ------------------------------------------------------------------------------------ */

            // NOTE (alternative): if the attachment must live inside S/4HANA instead of the
            // standalone DMS service, use the Attachment/DMS OData service (e.g. the
            // GOS/ArchiveLink or API_CV_ATTACHMENT_SRV) and upload via a media (stream) entity.
        },

        onFileRemoved: function () {
            if (this._uploadTimer) {
                clearInterval(this._uploadTimer);
                this._uploadTimer = null;
            }
            this.getView().getModel("vm").setProperty("/fileUploaded", this._getAttachmentCount() > 0);
        },

        // With instantUpload=false the file lives in the "incompleteItems" aggregation,
        // so both aggregations must be considered.
        _getAttachmentCount: function () {
            var oUploadSet = this.byId("attachmentUploadSet");
            if (!oUploadSet) {
                return 0;
            }
            return oUploadSet.getItems().length + oUploadSet.getIncompleteItems().length;
        },

        /* ---------- Line item actions ---------- */

        _getItemIndex: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("vm");
            return parseInt(oCtx.getPath().split("/").pop(), 10);
        },

        onAddItem: function () {
            var oModel = this.getView().getModel("vm");
            var aItems = oModel.getProperty("/items").slice();
            aItems.push(this._getEmptyItem());
            oModel.setProperty("/items", aItems);
            this._recalcTotals();
        },

        onCopyItem: function (oEvent) {
            var oModel = this.getView().getModel("vm");
            var aItems = oModel.getProperty("/items").slice();
            var iIndex = this._getItemIndex(oEvent);
            var oCopy = Object.assign({}, aItems[iIndex]);
            aItems.splice(iIndex + 1, 0, oCopy);
            oModel.setProperty("/items", aItems);
            this._recalcTotals();
            MessageToast.show("Line copied.");
        },

        onDeleteItem: function (oEvent) {
            var oModel = this.getView().getModel("vm");
            var aItems = oModel.getProperty("/items");

            if (aItems.length <= 1) {
                MessageToast.show("At least one line item is required.");
                return;
            }

            var iIndex = this._getItemIndex(oEvent);
            var aNext = aItems.slice();
            aNext.splice(iIndex, 1);
            oModel.setProperty("/items", aNext);
            this._recalcTotals();
        },

        /* ---------- Submit / Reset ---------- */

        onSubmit: function () {
            var oForm = this.getView().getModel("vm").getProperty("/form");
            var aMissing = [];

            var mRequired = {
                companyCode: "Company Code",
                paymentDate: "Payment Date",
                documentDate: "Document Date",
                receivedDate: "Received Date",
                baselineDate: "Baseline Date",
                exceptionReason: "Reference",
                invoiceInformation: "Invoice Information",
                paymentMethod: "Payment Method",
                payeeName: "Payee Name",
                payeeCity: "Payee City",
                invoiceAmount: "Invoice Amount",
                paymentCurrency: "Payment Currency",
                cashClearingGL: "Cash Clearing GL",
                valueDate: "Value Date",
                clearingText: "Clearing Text",
                preparedBy: "Prepared by"
            };

            Object.keys(mRequired).forEach(function (sKey) {
                var vVal = oForm[sKey];
                if (vVal === null || vVal === undefined || String(vVal).trim() === "") {
                    aMissing.push(mRequired[sKey]);
                }
            });

            if (aMissing.length > 0) {
                MessageBox.warning(
                    "Please complete the following required field(s):\n\n• " + aMissing.join("\n• ")
                );
                return;
            }

            // Send the attachment to DMS FIRST. Only when it resolves do we persist the
            // record and go back to the list. If it fails, show an error and abort the
            // submit (nothing is persisted and we stay on the form).
            var that = this;
            this.byId("oneTimeVendorPage").setBusy(true);

            this._sendFileToDMS(this._uploadedFile)
                .then(function () {
                    that.byId("oneTimeVendorPage").setBusy(false);
                    that._finishSubmit(oForm);
                })
                .catch(function (oError) {
                    that.byId("oneTimeVendorPage").setBusy(false);
                    var sMsg = (oError && oError.message) ? oError.message : String(oError);
                    MessageBox.error(
                        "The request could not be submitted because the attachment upload to DMS failed:\n\n" + sMsg
                    );
                });
        },

        // Persists the FULL record into the shared list (later: save to ZT_OTV_DATA),
        // then resets the form and returns to the list. Only runs after a successful DMS upload.
        _finishSubmit: function (oForm) {
            var oModel = this.getView().getModel("vm");
            var aItems = JSON.parse(JSON.stringify(oModel.getProperty("/items") || []));
            var oOtv = this.getOwnerComponent().getModel("otv");
            var aRecords = oOtv.getProperty("/records").slice();

            var oRecord = Object.assign({}, oForm, {
                invoiceAmount: this._numberFormat.format(this._toNumber(oForm.invoiceAmount)),
                fb60Invoice: "",
                f53Clearing: "",
                items: aItems
            });
            aRecords.unshift(oRecord);
            oOtv.setProperty("/records", aRecords);

            this._resetAll();
            MessageToast.show("Request submitted and added to the list.");
            this.getOwnerComponent().getRouter().navTo("oneTimeVendorList");
        },

        // Always invoked on entering the Create screen (route patternMatched) and after submit:
        // re-initialises every field AND the file-upload gate/logic.
        _resetAll: function () {
            this.getView().getModel("vm").setData(this._getEmptyData());
            this._recalcTotals();

            if (this._uploadTimer) {
                clearInterval(this._uploadTimer);
                this._uploadTimer = null;
            }
            this._uploadedFile = null;
            var oUploadSet = this.byId("attachmentUploadSet");
            if (oUploadSet) {
                oUploadSet.removeAllItems();
                oUploadSet.removeAllIncompleteItems();
            }
        },

        onResetFields: function () {
            MessageBox.confirm("Clear all fields in the Payment Details section?", {
                title: "Reset Fields",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this.getView().getModel("vm").setProperty("/form", this._getEmptyForm());
                        MessageToast.show("Fields cleared.");
                    }
                }.bind(this)
            });
        },

        onResetTable: function () {
            MessageBox.confirm("Remove all line items and start with one empty row?", {
                title: "Reset Table",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this.getView().getModel("vm").setProperty("/items", [this._getEmptyItem()]);
                        this._recalcTotals();
                        MessageToast.show("Line items cleared.");
                    }
                }.bind(this)
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("oneTimeVendorList");
        }

    });
});
