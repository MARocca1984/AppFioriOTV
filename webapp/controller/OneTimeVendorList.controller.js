sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("vendorapp.controller.OneTimeVendorList", {

        onInit: function () {
            // Filter values bound to the filter bar
            this.getView().setModel(new JSONModel({
                companyCode: "",
                sapVendor: "",
                payeeName: "",
                paymentDate: ""
            }), "flt");

            // For the demo the records come from the mock JSON model "otv" seeded in Component.js.
            // When the backend is approved, replace it by loading from the OData V4 service
            // (see _loadRecordsFromBackend below, kept commented meanwhile).
            // this._loadRecordsFromBackend();
        },

        /* ---------- Filtering (Company Code, SAP Vendor ID, Payee Name, Payment Date) ---------- */

        onApplyFilters: function () {
            var oFlt = this.getView().getModel("flt").getData();
            var aFilters = [];

            if (oFlt.companyCode) {
                aFilters.push(new Filter({ path: "companyCode", operator: FilterOperator.Contains, value1: oFlt.companyCode, caseSensitive: false }));
            }
            if (oFlt.sapVendor) {
                aFilters.push(new Filter({ path: "sapVendor", operator: FilterOperator.Contains, value1: oFlt.sapVendor, caseSensitive: false }));
            }
            if (oFlt.payeeName) {
                aFilters.push(new Filter({ path: "payeeName", operator: FilterOperator.Contains, value1: oFlt.payeeName, caseSensitive: false }));
            }
            if (oFlt.paymentDate) {
                aFilters.push(new Filter("paymentDate", FilterOperator.EQ, oFlt.paymentDate));
            }

            // All active filters combined with AND
            this.byId("otvRecordsTable").getBinding("items").filter(aFilters);
        },

        onClearFilters: function () {
            this.getView().getModel("flt").setData({
                companyCode: "",
                sapVendor: "",
                payeeName: "",
                paymentDate: ""
            });
            this.byId("otvRecordsTable").getBinding("items").filter([]);
        },

        /*
        // ============================================================================
        //  FUTURE — Load records from the backend (OData V4)
        // ----------------------------------------------------------------------------
        //  Source data lives in two custom tables:
        //    • ZT_DATAC_OTV  → header  (the input fields completed on screen)
        //    • ZT_DATAP_OTV  → position (the rows completed in the line-items table)
        //  Both are exposed together through CDS view ZCDS_OTV_DATA, published by the
        //  OData V4 service ZSB_OTV_APP. The position rows are reached via a navigation
        //  property (named here "_Items") from the header entity.
        //
        //  STEP 1 — Declare the data source + model in manifest.json:
        //
        //    "sap.app": {
        //      "dataSources": {
        //        "otvService": {
        //          "uri": "/sap/opu/odata4/sap/zsb_otv_app/srvd/sap/zsb_otv_app/0001/",
        //          "type": "OData",
        //          "settings": { "odataVersion": "4.0" }
        //        }
        //      }
        //    },
        //    "sap.ui5": {
        //      "models": {
        //        "otvOData": {
        //          "dataSource": "otvService",
        //          "type": "sap.ui.model.odata.v4.ODataModel",
        //          "settings": { "synchronizationMode": "None", "operationMode": "Server", "groupId": "$auto" }
        //        }
        //      }
        //    }
        //
        //  STEP 2 — Read it and map it into the local "otv" JSON model used by the UI:
        //
        //  _loadRecordsFromBackend: function () {
        //      var oOData = this.getOwnerComponent().getModel("otvOData");
        //      var oListBinding = oOData.bindList("/ZCDS_OTV_DATA", null, null, null, {
        //          $expand: "_Items"   // brings the ZT_DATAP_OTV position rows for each header
        //      });
        //
        //      oListBinding.requestContexts(0, 1000).then(function (aContexts) {
        //          var aRecords = aContexts.map(function (oCtx) {
        //              var h = oCtx.getObject();
        //              return {
        //                  // ----- header (ZT_DATAC_OTV) -----
        //                  companyCode:        h.CompanyCode,
        //                  paymentDate:        h.PaymentDate,
        //                  documentDate:       h.DocumentDate,
        //                  receivedDate:       h.ReceivedDate,
        //                  baselineDate:       h.BaselineDate,
        //                  exceptionReason:    h.Reference,
        //                  invoiceInformation: h.DocHeaderText,
        //                  paymentMethod:      h.PaymentMethod,
        //                  payeeName:          h.PayeeName,
        //                  payeeCity:          h.PayeeCity,
        //                  invoiceAmount:      h.InvoiceAmount,
        //                  taxAmount:          h.TaxAmount,
        //                  docType:            h.DocType,
        //                  sapVendor:          h.SapVendorId,
        //                  paymentCurrency:    h.PaymentCurrency,
        //                  cashClearingGL:     h.CashClearingGl,
        //                  valueDate:          h.ValueDate,
        //                  clearingText:       h.ClearingText,
        //                  preparedBy:         h.PreparedBy,
        //                  fb60Invoice:        h.Fb60Invoice,
        //                  f53Clearing:        h.F53Clearing,
        //                  // ----- positions (ZT_DATAP_OTV) -----
        //                  items: (h._Items || []).map(function (p) {
        //                      return {
        //                          postingKey:  p.PostingKey,
        //                          glAccount:   p.GlAccount,
        //                          debit:       p.NetAmountDebit,
        //                          credit:      p.NetAmountCredit,
        //                          taxCode:     p.TaxCode,
        //                          costCtr:     p.CostCenter,
        //                          wbsElement:  p.WbsElement,
        //                          profitCtr:   p.ProfitCenter,
        //                          companyCode: p.CompanyCode,
        //                          text:        p.ItemText
        //                      };
        //                  })
        //              };
        //          });
        //          this.getOwnerComponent().getModel("otv").setProperty("/records", aRecords);
        //      }.bind(this));
        //  },
        //
        //  NOTE: creating (Submit) and editing (Save) / FB60 / F-53 will likewise become
        //  OData V4 create/update operations against ZSB_OTV_APP instead of the in-memory writes.
        // ============================================================================
        */

        onCreateOTV: function () {
            this.getOwnerComponent().getRouter().navTo("oneTimeVendor");
        },

        onRecordPress: function (oEvent) {
            var sIndex = oEvent.getSource().getBindingContext("otv").getPath().split("/").pop();
            this.getOwnerComponent().getRouter().navTo("oneTimeVendorDetail", { index: sIndex });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }

    });
});
