$(document).ready(function() {

  $("#populateDB").click(function() {
    // Initialize user data
    // userData.forEach(function(user) {
    //     $.post("http://localhost:3000/users", user, function(data,status) {
    //     }).fail(function(response) {
    //       console.log("Error uploading pre-iniitialized user data.");
    //     });
    //
    // console.log("User data initialized");
    // });

    // Initialize group data
    groupData.forEach(function(group) {
      $.post("http://localhost:3000/groups", group, function(data,status) {
      }).fail(function(response) {
        console.log("Error uploading pre-iniitialized group data.");
      });

      console.log("User group initialized");
    });

  });

  $("#clearDB").click(function() {
    $.ajax({
      type: 'DELETE',
      url: 'groups/delete/all'
    }).done(function(resp) {
    });
  });


});


var userData =
  [
    {
        "username": "Maggie",
        "password": "",
        "link": "yahoo.com",
        "calendar": []
    },

    {
        "username": "Armaan",
        "password": "",
        "link": "yahoo.com",
        "calendar": []
    },

    {
        "username": "Cathy",
        "password": "",
        "link": "yahoo.com",
        "calendar": []
    },

    {
        "username": "Sophia",
        "password": "",
        "link": "yahoo.com",
        "calendar": []
    }
  ];

var groupData =
  [
    {
      "name": "Maggie Test Group",
      "startDate" : "2019-04-15T18:25:43.511Z",
      "endDate" : "2019-04-23T18:25:43.511Z",
      "link" : "meetme.com\/grouplink",
      "calendar": [
      {
        "startTime" : "2019-04-17T06:25:43.511Z",
        "endTime" : "2019-04-17T18:25:43.511Z",
        "names": ["Maggie", "Armaan"]
      },
      {
        "startTime" : "2019-04-18T06:25:43.511Z",
        "endTime" : "2019-04-18T18:25:43.511Z",
        "names": ["Maggie"]
      },
      {
        "startTime" : "2019-04-19T06:25:43.511Z",
        "endTime" : "2019-04-19T18:25:43.511Z",
        "names": ["Maggie", "Armaan", "Sophia"]
      }
      ]
    },

    {
      "name": "Second Test Group",
      "startDate" : "2019-04-15T18:25:43.511Z",
      "endDate" : "2019-04-23T18:25:43.511Z",
      "link" : "meetme.com\/grouplink",
      "calendar": [
      {
        "startTime" : "2019-04-17T06:25:43.511Z",
        "endTime" : "2019-04-17T18:25:43.511Z",
        "names": ["Maggie", "Armaan"]
      }
      ]
    }
];
