$(document).ready(function() {

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
				"title": "Maggie Test Group",
				"startDate" : "2017-05-15T18:25:43.511Z",
				"endDate" : "2017-05-23T18:25:43.511Z",
				"link" : "meetme.com\/grouplink",
				"calendar": [
				{
					"startTime" : "2017-05-17T06:25:43.511Z",
					"endTime" : "2017-05-17T18:25:43.511Z",
					"names": ["Maggie", "Armaan"]
				},
				{
					"startTime" : "2017-05-18T06:25:43.511Z",
					"endTime" : "2017-05-18T18:25:43.511Z",
					"names": ["Maggie"]
				},
				{
					"startTime" : "2017-05-19T06:25:43.511Z",
					"endTime" : "2017-05-19T18:25:43.511Z",
					"names": ["Maggie", "Armaan", "Sophia"]
				}
				]
			},

			{
				"title": "Second Test Group",
				"startDate" : "2017-05-15T18:25:43.511Z",
				"endDate" : "2017-05-23T18:25:43.511Z",
				"link" : "meetme.com\/grouplink",
				"calendar": [
				{
					"startTime" : "2017-05-17T06:25:43.511Z",
					"endTime" : "2017-05-17T18:25:43.511Z",
					"names": ["Maggie", "Armaan"]
				}
				]
			}
    ];

  $("#db_init").click(function() {
    // Initialize user data
    userData.forEach(function(user) {
        $.post("http://localhost:3000/users", user, function(data,status) {
        }).fail(function(response) {
          console.log("Error uploading pre-iniitialized user data.");
        });

    console.log("User data initialized");
    });

    // Initialize group data
    groupData.forEach(function(group) {
        $.post("http://localhost:3000/groups", group, function(data,status) {
        }).fail(function(response) {
          console.log("Error uploading pre-iniitialized group data.");
        });

    console.log("User group initialized");
    });

  });

//bottom of document
});
