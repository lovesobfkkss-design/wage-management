/*
  Legacy Nanum Gothic font loader stub.
  Prevents jsPDF TTF parsing errors when old cached HTML loads this file.
*/
(function () {
  window.addNanumGothicFont = function () {
    console.warn('Nanum Gothic font data not loaded. Skipping custom font registration.');
    return false;
  };
})();
