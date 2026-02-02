/*
  Safe stub for legacy Nanum Gothic font loader.
  Prevents jsPDF TTF parsing errors when the font data is missing or invalid.
*/
(function () {
  window.addNanumGothicFont = function () {
    console.warn('Nanum Gothic font data not loaded. Skipping custom font registration.');
    return false;
  };
})();
