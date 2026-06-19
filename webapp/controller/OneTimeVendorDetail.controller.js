sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast"
], function (Controller, JSONModel, NumberFormat, MessageToast) {
    "use strict";

    return Controller.extend("vendorapp.controller.OneTimeVendorDetail", {

        onInit: function () {
            this._numberFormat = NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 0,
                maxFractionDigits: 2
            });

            this.getView().setModel(new JSONModel({
                index: -1,
                editMode: false,
                dirty: false,
                data: {},
                totalDebit: "0",
                totalCredit: "0"
            }), "detail");

            this.getOwnerComponent().getRouter()
                .getRoute("oneTimeVendorDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var iIndex = parseInt(oEvent.getParameter("arguments").index, 10);
            this._loadRecord(iIndex);
        },

        _loadRecord: function (iIndex) {
            var oOtv = this.getOwnerComponent().getModel("otv");
            var oRecord = oOtv.getProperty("/records/" + iIndex);
            var oModel = this.getView().getModel("detail");

            if (!oRecord) {
                this.onNavBack();
                return;
            }

            oModel.setProperty("/index", iIndex);
            oModel.setProperty("/editMode", false);
            oModel.setProperty("/dirty", false);
            oModel.setProperty("/data", JSON.parse(JSON.stringify(oRecord)));
            this._recalc();
        },

        /* ---------- Totals ---------- */

        _toNumber: function (vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return 0;
            }
            var fParsed = parseFloat(String(vValue).replace(/[^0-9.\-]/g, ""));
            return isNaN(fParsed) ? 0 : fParsed;
        },

        _recalc: function () {
            var oModel = this.getView().getModel("detail");
            var aItems = oModel.getProperty("/data/items") || [];
            var fDebit = 0;
            var fCredit = 0;

            aItems.forEach(function (oItem) {
                fDebit += this._toNumber(oItem.debit);
                fCredit += this._toNumber(oItem.credit);
            }.bind(this));

            oModel.setProperty("/totalDebit", this._numberFormat.format(fDebit));
            oModel.setProperty("/totalCredit", this._numberFormat.format(fCredit));
        },

        /* ---------- View / edit toggle ---------- */

        _markDirty: function () {
            var oModel = this.getView().getModel("detail");
            if (oModel.getProperty("/editMode")) {
                oModel.setProperty("/dirty", true);
            }
        },

        onFieldChange: function () {
            this._markDirty();
        },

        onItemAmountChange: function () {
            this._recalc();
            this._markDirty();
        },

        onModify: function () {
            this.getView().getModel("detail").setProperty("/editMode", true);
        },

        onCancel: function () {
            // Discard changes by reloading the original record
            this._loadRecord(this.getView().getModel("detail").getProperty("/index"));
        },

        onSave: function () {
            var oModel = this.getView().getModel("detail");
            this._persist();
            oModel.setProperty("/editMode", false);
            oModel.setProperty("/dirty", false);
            MessageToast.show("Changes saved.");
        },

        _persist: function () {
            var oModel = this.getView().getModel("detail");
            var iIndex = oModel.getProperty("/index");
            var oData = JSON.parse(JSON.stringify(oModel.getProperty("/data")));
            this.getOwnerComponent().getModel("otv").setProperty("/records/" + iIndex, oData);
        },

        /* ---------- Line item actions (edit mode) ---------- */

        _getEmptyItem: function () {
            return {
                postingKey: "40 - Debit",
                glAccount: "", debit: "", credit: "", taxCode: "",
                costCtr: "", wbsElement: "", profitCtr: "", companyCode: "", text: ""
            };
        },

        _getItemIndex: function (oEvent) {
            return parseInt(oEvent.getSource().getBindingContext("detail").getPath().split("/").pop(), 10);
        },

        onAddItem: function () {
            var oModel = this.getView().getModel("detail");
            var aItems = (oModel.getProperty("/data/items") || []).slice();
            aItems.push(this._getEmptyItem());
            oModel.setProperty("/data/items", aItems);
            this._recalc();
            this._markDirty();
        },

        onCopyItem: function (oEvent) {
            var oModel = this.getView().getModel("detail");
            var aItems = oModel.getProperty("/data/items").slice();
            var iIndex = this._getItemIndex(oEvent);
            aItems.splice(iIndex + 1, 0, Object.assign({}, aItems[iIndex]));
            oModel.setProperty("/data/items", aItems);
            this._recalc();
            this._markDirty();
        },

        onDeleteItem: function (oEvent) {
            var oModel = this.getView().getModel("detail");
            var aItems = oModel.getProperty("/data/items");

            if (aItems.length <= 1) {
                MessageToast.show("At least one line item is required.");
                return;
            }
            var aNext = aItems.slice();
            aNext.splice(this._getItemIndex(oEvent), 1);
            oModel.setProperty("/data/items", aNext);
            this._recalc();
            this._markDirty();
        },

        /* ---------- FB60 / F-53 creation ----------
         *
         *  TEMPORARY DEMO BEHAVIOUR (active):
         *  Each button fills its field with a random, fictitious 10-digit SAP-style
         *  document number and persists it locally.
         *
         *  REAL BEHAVIOUR AFTER APPROVAL (see commented _createDocumentViaBackend below):
         *  Each button will trigger a backend action on the OData V4 service ZSB_OTV_APP.
         *  That action runs an RFC-enabled function module which calls the standard SAP
         *  BAPI for each case (FB60 manual invoice posting / F-53 outgoing-payment
         *  clearing). The BAPI performs the real SAP standard process and returns the
         *  generated document number by parameter; that number is written into the
         *  matching field on screen AND persisted in the header table ZT_DATAC_OTV.
         */

        // Random, fictitious 10-digit SAP-style document number (demo only).
        _genDoc: function (sPrefix) {
            var sRandom = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
            return sPrefix + sRandom;
        },

        onCreateFB60: function () {
            var sDoc = this._genDoc("51");
            this.getView().getModel("detail").setProperty("/data/fb60Invoice", sDoc);
            this._persist();
            MessageToast.show("FB60 invoice created — document " + sDoc);
        },

        onCreateF53: function () {
            var sDoc = this._genDoc("15");
            this.getView().getModel("detail").setProperty("/data/f53Clearing", sDoc);
            this._persist();
            MessageToast.show("F-53 clearing created — document " + sDoc);
        },

        /*
        // ============================================================================
        //  FUTURE — real document creation via backend action (RFC → BAPI)
        // ----------------------------------------------------------------------------
        //  Replace the two handlers above with calls to a backend action on ZSB_OTV_APP.
        //  The action executes an RFC function module that runs the standard SAP BAPI,
        //  posts the document, and returns the real document number by parameter, which
        //  is then shown on screen and persisted in the header table ZT_DATAC_OTV.
        //
        //    • Create FB60 Invoice  → action "CreateFB60Invoice"  (BAPI: FB60 manual
        //                             invoice posting, e.g. BAPI_INCOMINGINVOICE_CREATE
        //                             / BAPI_ACC_DOCUMENT_POST)
        //    • Create F-53 Clearing → action "CreateF53Clearing"  (BAPI: F-53 outgoing
        //                             payment / clearing posting)
        //
        //  onCreateFB60: function () {
        //      this._createDocumentViaBackend("CreateFB60Invoice", "Fb60Invoice", "/data/fb60Invoice");
        //  },
        //  onCreateF53: function () {
        //      this._createDocumentViaBackend("CreateF53Clearing", "F53Clearing", "/data/f53Clearing");
        //  },
        //
        //  _createDocumentViaBackend: function (sActionName, sReturnParam, sTargetPath) {
        //      var oOData    = this.getOwnerComponent().getModel("otvOData");
        //      var oDetail   = this.getView().getModel("detail");
        //      var sKey      = oDetail.getProperty("/data/recordKey");   // header key in ZT_DATAC_OTV
        //      // Bound action on the header entity of the OData V4 service:
        //      var oAction = oOData.bindContext(
        //          "/ZCDS_OTV_DATA(" + sKey + ")/com.sap.gateway.srvd.zsb_otv_app.v0001." + sActionName + "(...)"
        //      );
        //      oAction.execute().then(function () {
        //          // The RFC/BAPI returns the generated document number as an action parameter:
        //          var sDocNo = oAction.getBoundContext().getProperty(sReturnParam);
        //          oDetail.setProperty(sTargetPath, sDocNo);            // update field on screen
        //          // Persistence happens in the backend (ZT_DATAC_OTV) as part of the action;
        //          // refresh the row so the list reflects the saved value:
        //          this.getOwnerComponent().getModel("otvOData").refresh();
        //      }.bind(this)).catch(function (oError) {
        //          sap.m.MessageBox.error("Document creation failed: " + oError.message);
        //      });
        //  },
        // ============================================================================
        */

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("oneTimeVendorList");
        }

    });
});
