window.$ = require('jquery');

$(document).ready(function() {
  $('#feedback-text').click( function() {
    window.location.assign('/feedback');
  });
});
