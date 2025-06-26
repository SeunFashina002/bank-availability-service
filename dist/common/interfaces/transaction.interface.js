"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceLevel = exports.StatusCode = void 0;
var StatusCode;
(function (StatusCode) {
    StatusCode["SUCCESS"] = "00";
    StatusCode["UNAVAILABLE"] = "91";
})(StatusCode || (exports.StatusCode = StatusCode = {}));
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel["INSUFFICIENT_DATA"] = "Insufficient Data";
    ConfidenceLevel["LOW"] = "Low";
    ConfidenceLevel["MEDIUM"] = "Medium";
    ConfidenceLevel["HIGH"] = "High";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
//# sourceMappingURL=transaction.interface.js.map