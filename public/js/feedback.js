window.$ = require('jquery');

$(document).ready(function() {
  $('#feedback-button').click(function() {
    var text = document.getElementById('feedback-input').value;
    if (text != "") {
      $.post(
        '../feedback',
        {
          text: text
        }, function (data, status) {
        });
      document.getElementById('feedback-input').value = "";
      showSavedPopup();
    };
  });
});

function showSavedPopup() {
  document.getElementById('savedPopup').style.display = 'block';
  setTimeout(
    function() {
      document.getElementById('savedPopup').style.display = 'none';
    },
    2500
  );
}
