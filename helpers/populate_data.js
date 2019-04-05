const request = require('request');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const baseURL = "http://localhost:3000/";

var eventStartTime1 = moment(new Date()).hour(12);
var eventEndTime1 = eventStartTime1.clone().add(2, 'hours');

var eventStartTime2 = eventStartTime1.clone().add(1, 'days');
var eventEndTime2 = eventStartTime2.clone().add(2, 'hours');


exports.clearDB = () => {
  var URL = baseURL + "groups/delete/all";
  request.del(URL);
}

exports.populateDatabase = () => {
  populateGroupData();
}

function populateGroupData() {
  var URL = baseURL + "groups";
  var groupData = generateGroupData();
  groupData.forEach(function(group) {
    request.post( {
      url: URL,
      body: group,
      json: true
    }, function(err, response, body) {
      if (err) {
        console.log("Error uploading pre-iniitialized group data.");
      }
      console.log(response.request.body.name);
      var responseBody = JSON.parse(response.request.body);
      console.log("Response body: " + responseBody._id);
      populateGroupCalData(responseBody._id);
    });
  });
}

function populateGroupCalData(groupID) {
  var URL = baseURL + "cal";
  var calData = generateGroupCalData();
  calData.forEach(function(calEvent) {
    request.post( {
      url: URL,
      body: calEvent,
      json: true
    }, function(err, response, body) {
      if (err) {
        console.log("Error uploading pre-iniitialized cal data.");
      }

      // Link cal events to corresponding group
      var groupCalEventURL = baseURL + "groupcalevent";
      var groupCalEvent =
        {
          "groupID": groupID,
          "calEventID": calEvent._id
        };
      request.post( {
        url: groupCalEventURL,
        body: groupCalEvent,
        json: true
      }, function(err, response, body) {
        if (err) {
          console.log("Error linking cal event to corresponding group.");
        }
      });
    });
  });

}

function generateGroupCalData() {
  var event1 =
    {
      "_id": new ObjectID(),
      "startTime" : eventStartTime1.toISOString(),
      "endTime" : eventEndTime1.toISOString(),
      "busyPeople": ["Maggie", "Armaan"]
    };

  var event2 =
    {
      "_id": new ObjectID(),
      "startTime" : eventStartTime2.toISOString(),
      "endTime" : eventEndTime2.toISOString(),
      "names": ["Maggie"]
    };

  var calData = [event1, event2];
  return calData;
}

function generateGroupData() {

  var groupData =
    [
      {
        "name": "Test",
        "startDate" : eventStartTime1.toISOString(),
        "endDate" : eventEndTime2.toISOString(),
        "link" : "meetme.com\/grouplink",
      },
    ];

  return groupData;
}

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

