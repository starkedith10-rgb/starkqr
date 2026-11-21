/* STARK QR MIT only: build one 100 x 50 mm DMI/DPL label.
 * The printer is configured for DMI / STD. Control bytes are included.
 */
(function (root) {
  "use strict";
  function clean(value, maxLength) {
    return String(value == null ? "" : value)
      .replace(/[\r\n\x00-\x1f\x7f]/g, " ")
      .replace(/[^\x20-\x7e]/g, "?")
      .replace(/"/g, "'")
      .trim()
      .slice(0, maxLength);
  }
  function textRecord(value, row, column) {
    return "121100000" + String(row).padStart(4, "0") +
      String(column).padStart(4, "0") + clean(value, 80) + "\r";
  }
  function buildMitDplPayload(fields) {
    const part = clean(fields.part || "N/A", 80);
    const serial = clean(fields.serial || "N/A", 60);
    const port = clean(fields.port || "N/A", 80);
    return [
      "\x02m\r",
      "\x02L\r",
      "D11\r",
      textRecord("PART: " + part, 450, 20),
      textRecord("SERIAL: " + serial, 390, 20),
      textRecord("PORT: " + port, 330, 20),
      "1E0000080120100" + (serial || "N/A") + "\r",
      "Q0001\r",
      "E\r"
    ].join("");
  }
  root.buildMitDplPayload = buildMitDplPayload;
})(window);
